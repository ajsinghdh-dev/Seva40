import { test } from "node:test";
import assert from "node:assert/strict";
import { seed, transition, approvedHours } from "../lib/model.ts";
import { authorizeAction, filterWorkspace } from "../lib/server/access.ts";
import { actionSchema } from "../lib/server/validation.ts";
const student="71a84012-9c09-4f0a-bc20-cf0c1e6eb461";
test("students cannot promote themselves through committee actions",()=>{
  const s=seed();
  for(const action of [{type:"review",claimId:s.claims[0].id,decision:"approved",hours:1,note:""},{type:"archive",taskId:s.tasks[0].id},{type:"task",task:s.tasks[0]},{type:"notice",notice:s.notices[0]}] as const)
    assert.throws(()=>authorizeAction(s,action,student,"student"),/Committee/);
});
test("students and committee members cannot modify another student's evidence",()=>{
  const s=seed();
  for(const role of ["student","committee"] as const) assert.throws(()=>authorizeAction(s,{type:"start",claimId:s.claims[0].id},student,role),/own/);
});
test("committee members cannot approve their own hours",()=>{
  const s=seed();s.claims[0].studentId=student;
  assert.throws(()=>authorizeAction(s,{type:"review",claimId:s.claims[0].id,decision:"approved",hours:1,note:""},student,"committee"),/Another/);
});
test("student workspace hides other claims, drafts, audits, and private notices",()=>{
  const s=seed();s.tasks[0].published=false;s.audit=[{id:crypto.randomUUID(),action:"review",detail:"Private review",actor:"Committee",at:new Date().toISOString()}];
  s.notices.push({id:crypto.randomUUID(),title:"Private decision",body:"Other student",date:new Date().toISOString(),read:false,audience:"students",recipientId:"someone-else"});
  const out=filterWorkspace(s,student,"student");
  assert.equal(out.claims.length,0);assert.equal(out.audit.length,0);assert.ok(!out.tasks.some(t=>t.id===s.tasks[0].id));assert.ok(!out.notices.some(n=>n.recipientId || n.audience==="committee"));
  assert.equal(out.occupancy?.[s.tasks[1].id],1);
});
test("committee workspace retains review records but not another student's private notice",()=>{
  const s=seed();s.notices.push({id:crypto.randomUUID(),title:"Private",body:"Student decision",date:new Date().toISOString(),read:false,audience:"students",recipientId:"other"});
  const out=filterWorkspace(s,student,"committee");assert.equal(out.claims.length,s.claims.length);assert.ok(!out.notices.some(n=>n.recipientId==="other"));
});
test("a live reservation belongs to the authenticated student, not the demo identity",()=>{
  const s=seed();s.viewerId=student;s.tasks[0].date="2099-01-01";
  const next=transition(s,{type:"reserve",taskId:s.tasks[0].id});assert.equal(next.claims[0].studentId,student);assert.equal(approvedHours(next),0);
});
test("network validation rejects role injection, invalid grades, and malformed task IDs",()=>{
  assert.equal(actionSchema.safeParse({type:"reserve",taskId:student,role:"committee"}).success,false);
  assert.equal(actionSchema.safeParse({type:"reserve",taskId:"demo-task"}).success,false);
  assert.equal(actionSchema.safeParse({type:"profile",profile:{...seed().profile,grade:9}}).success,false);
});
test("network validation rejects untrusted evidence and non-quarter hour claims",()=>{
  assert.equal(actionSchema.safeParse({type:"evidence",claimId:student,phase:"before",evidence:{data:"storage:other/private.jpg",name:"x",capturedAt:"x"}}).success,false);
  assert.equal(actionSchema.safeParse({type:"finish",claimId:student,hours:.3,reflection:"I completed community service.",checks:[]}).success,false);
});
