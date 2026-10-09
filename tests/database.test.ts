import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("Postgres enforces private records, atomic revisions, and an append-only audit",async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
  await db.exec(await readFile(new URL("../supabase/migrations/001_live_workspace.sql",import.meta.url),"utf8"));
  await db.exec("set role anon");
  await assert.rejects(()=>db.query("select * from public.seva_workspace"),/permission denied/);
  await assert.rejects(()=>db.query("select public.seva_compare_and_swap(0,'{}'::jsonb)"),/permission denied/);
  await db.exec("reset role;set role authenticated");
  await assert.rejects(()=>db.query("insert into public.seva_committee(user_id) values('71a84012-9c09-4f0a-bc20-cf0c1e6eb461')"),/permission denied/);
  await db.exec("reset role;set role service_role");
  const {rows}=await db.query<{document:any}>("select document from public.seva_workspace");
  const doc=rows[0].document;
  assert.equal(doc.workspace.claims.length,0);assert.equal(doc.workspace.tasks.length,0);
  const event={id:crypto.randomUUID(),action:"task",detail:"Real task",actor:"Committee",at:new Date().toISOString()};doc.workspace.audit.unshift(event);
  const first=await db.query<{ok:boolean}>("select public.seva_compare_and_swap($1,$2::jsonb) as ok",[0,JSON.stringify(doc)]);assert.equal(first.rows[0].ok,true);
  const stale=await db.query<{ok:boolean}>("select public.seva_compare_and_swap($1,$2::jsonb) as ok",[0,JSON.stringify(doc)]);assert.equal(stale.rows[0].ok,false);
  const revision=await db.query<{revision:number}>("select revision from public.seva_workspace");assert.equal(Number(revision.rows[0].revision),1);
  const audits=await db.query("select * from public.seva_audit");assert.equal(audits.rows.length,1);
  await assert.rejects(()=>db.query("delete from public.seva_audit"),/permission denied/);
  await db.exec("reset role");
  const bucket=await db.query<{public:boolean}>("select public from storage.buckets where id='seva-evidence'");assert.equal(bucket.rows[0].public,false);
 }finally {await db.close();}
});
