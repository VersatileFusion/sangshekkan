# Student Dashboard E2E Checklist

Prereqs: Authenticated user session in browser (or cookie captured). Server running at http://localhost:4000.

1. Upload URL
   - POST /api/student/reports/upload-url with {contentType,size,originalName}
   - Expect 200 and fields: uploadUrl, fileKey, maxSize
2. Upload file
   - PUT uploadUrl
   - Expect 200/204
3. Commit report
   - POST /api/student/reports with {date,testCount,studyHours,subject,notes?,fileKey?}
   - Expect 201 and created report JSON
4. List reports
   - GET /api/student/reports?period=weekly|monthly|all
   - Expect 200 array; items include feedback when exists
5. Dashboard stats
   - GET /api/student/dashboard-stats
   - Expect counts {approved,rejected,pending}
6. Notifications
   - GET /api/student/notifications
   - Expect 200 array (may be empty)
7. UI flow
   - /student-dashboard shows stats + chart
   - /student-dashboard/reports shows form and list; upload displays progress; list opens modal with details




