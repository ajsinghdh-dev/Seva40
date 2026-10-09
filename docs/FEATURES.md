# Seva 40 — 60 implemented application features

This inventory describes the implemented authenticated application. Google sign-in, shared persistence, role-specific portals, and responsive desktop/iPhone interfaces are active in production. See `VALIDATION.md` for the verified release checks and practical limits.

| #   | Feature                                                                                                       | Where to try it                         |
| --- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | Reference-inspired dark dashboard with a clean charcoal hero, stacked widgets, three lower cards and orange hour gauge | Overview                                |
| 2   | Responsive phone layout with a fixed navigation bar                                                           | Open at phone width                     |
| 3   | Dark and light appearance, saved to your account                                                               | Header theme buttons                    |
| 4   | Authenticated student and committee portals                                                                         | Authorized workspace switch or shield icon       |
| 5   | Global search for tasks, records and committee lists                                                          | Header search                           |
| 6   | Keyboard shortcut to focus search                                                                             | Cmd/Ctrl + K                            |
| 7   | Grade-aware opportunities for grades 10–12                                                                    | Profile grade + Find seva               |
| 8   | Service-category filters                                                                                      | Find seva                               |
| 9   | Save opportunities and show only saved tasks                                                                  | Find seva bookmarks                     |
| 10  | Accessible/seated-activity filter                                                                             | Find seva                               |
| 11  | Filter shifts by maximum duration                                                                             | Find seva                               |
| 12  | Sort opportunities by date, duration or spaces                                                                | Find seva                               |
| 13  | Detailed task view with location, time, supervisor, supplies and checklist                                    | View task                               |
| 14  | Reserve a volunteer space                                                                                     | Task details                            |
| 15  | Capacity tracking, full-shift protection and duplicate-reservation protection                                 | Reserve a task                          |
| 16  | Cancel a reservation and release its space                                                                    | My evidence → shift                     |
| 17  | Upload or take before/after photos from the device’s file picker                                              | My evidence → shift                     |
| 18  | Before-photo requirement before starting a task                                                               | Start shift                             |
| 19  | Recorded shift start time                                                                                     | Evidence workspace                      |
| 20  | Replace evidence before submitting or when changes are requested                                              | Evidence workspace                      |
| 21  | Photo format and 15 MB upload validation                                                                      | Evidence upload                         |
| 22  | Photo resizing, compression and metadata removal                                                              | Automatic during upload                 |
| 23  | Task completion checklist                                                                                     | Evidence workspace                      |
| 24  | Student reflection with length validation                                                                     | Evidence workspace                      |
| 25  | Session draft saving for reflection, hours and checklist                                                      | Close/reopen a shift                    |
| 26  | Requested-hours validation in quarter-hour increments, bounded by the task                                    | Evidence workspace                      |
| 27  | Submit completed work to the committee                                                                        | Submit for approval                     |
| 28  | Filter evidence by active, in review, changes requested, approved or all                                      | My evidence                             |
| 29  | Pending hours are excluded from credited totals                                                               | Submit, then view Overview              |
| 30  | Committee review queue with before/after evidence and reflections                                             | Committee → Review queue                |
| 31  | Approve a verified amount of hours, including partial credit                                                  | Committee review                        |
| 32  | Request evidence changes with a required explanation                                                          | Committee review                        |
| 33  | Read feedback, amend and resubmit a task                                                                      | Student → My evidence                   |
| 34  | Decline a submission with a required explanation                                                              | Committee review                        |
| 35  | Lock approved evidence and prevent repeat approval/double credit                                              | Approved submission                     |
| 36  | Automatically add approved hours to the logbook and goal gauge                                                | Approve a submission                    |
| 37  | Logbook filters, date/hour sorting and record drill-down                                                      | Logbook                                 |
| 38  | Download a CSV of approved entries                                                                            | Logbook → CSV                           |
| 39  | Download a multi-page PDF logbook with reviewer details and signature spaces                                  | Logbook → Download PDF                  |
| 40  | Download an individual service record                                                                         | Open an approved entry                  |
| 41  | Print-friendly logbook                                                                                        | Logbook → Print                         |
| 42  | Weekly calendar with previous/next/current week controls                                                      | Calendar                                |
| 43  | Toggle community shifts versus personal reservations                                                          | Calendar                                |
| 44  | Download individual shifts or a whole week as calendar events                                                 | Task / Calendar export                  |
| 45  | Personalized total-hour goal and target date                                                                  | Settings                                |
| 46  | Five approved-hour milestones and a weekly service goal                                                       | Milestones                              |
| 47  | Student profile, grade, school and interest preferences                                                       | Settings                                |
| 48  | Parent/guardian discussion and school-eligibility confirmation markers                                        | Settings                                |
| 49  | Compact lists and reduced-motion preferences                                                                  | Settings                                |
| 50  | In-app reminders for reserved shifts                                                                          | Overview / reminder setting             |
| 51  | Community notifications and read/unread controls                                                              | Bell button                             |
| 52  | Committee announcements with student/committee/everyone audiences                                             | Committee → Announcements               |
| 53  | Create and publish weekly tasks with dates, time, duration and capacity                                       | Committee → New task                    |
| 54  | Edit unreserved tasks; save drafts; duplicate tasks for a new shift                                           | Committee → Weekly tasks                |
| 55  | Archive/restore opportunities while preserving student records                                                | Committee → Weekly tasks                |
| 56  | Configure eligible grades, accessibility, supervisor, checklist, supplies and dashboard spotlight             | Task editor                             |
| 57  | Private registered-student directory with grade filters and latest-record access                                  | Committee → Students                    |
| 58  | Community impact totals, category bars, capacity reports and report download                                  | Committee → Impact report               |
| 59  | Server-owned activity history/export and personal-record download                                      | Committee → Activity log / Settings     |
| 60  | Shared persistence, private cloud photos, accessible dialogs and contextual guidance  | Refresh, secure uploads, Escape/Tab, Help |

## Authentication and private records

Google sign-in and callback exchange are implemented through Supabase. The Committee sign-in path records the authenticated account in the committee membership table. Shared routes verify the current user and committee membership on every request. Students cannot grant themselves roles through profile data, edit another student’s evidence, or approve hours. Committee members cannot approve their own submissions. Expiring photo links are issued only after authorization. Atomic revisions protect shared updates, and old browser sample records are not imported.
