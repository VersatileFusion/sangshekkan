import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    // Get user info
    const userQuery = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (userQuery.length === 0) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    const currentUser = userQuery[0];
    const isAdvisor =
      currentUser.role === "advisor" ||
      session.user.email === "melika.sangshakan@advisor.com";

    let reportsQuery = `
      SELECT 
        dr.*,
        u.name as user_name,
        u.student_grade,
        u.student_field,
        u.profile_image_url,
        ARRAY_AGG(
          CASE WHEN rf.id IS NOT NULL THEN 
            JSON_BUILD_OBJECT(
              'id', rf.id,
              'fileName', rf.file_name,
              'fileUrl', rf.file_url,
              'fileType', rf.file_type,
              'fileSize', rf.file_size,
              'uploadedAt', rf.uploaded_at
            )
          END
        ) FILTER (WHERE rf.id IS NOT NULL) as files
      FROM daily_reports dr
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN report_files rf ON dr.id = rf.report_id
      WHERE 1=1
    `;

    const queryParams = [];

    // Filter by user - advisor can see all, students see only their own
    if (isAdvisor) {
      // Enforce RBAC: only see reports for students assigned to this advisor unless a specific userId is requested and also assigned
      if (userId) {
        reportsQuery += ` AND dr.user_id = $${queryParams.length + 1}`;
        queryParams.push(parseInt(userId));
      }
      reportsQuery += ` AND u.assigned_advisor_id = $${queryParams.length + 1}`;
      queryParams.push(currentUser.id);
    } else {
      reportsQuery += ` AND dr.user_id = $${queryParams.length + 1}`;
      queryParams.push(currentUser.id);
    }

    // Filter by date
    if (date) {
      reportsQuery += ` AND dr.report_date = $${queryParams.length + 1}`;
      queryParams.push(date);
    }

    // Filter by status
    if (status) {
      reportsQuery += ` AND dr.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    reportsQuery += `
      GROUP BY dr.id, u.name, u.student_grade, u.student_field, u.profile_image_url
      ORDER BY dr.report_date DESC, dr.created_at DESC
      LIMIT 50
    `;

    const reports = await sql(reportsQuery, queryParams);

    return Response.json({ reports });
  } catch (error) {
    console.error("Get reports error:", error);
    return Response.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const {
      reportDate,
      subject,
      testSource,
      testCount,
      studyDuration,
      ghalamchiScore,
      description,
      imageUrl,
    } = await request.json();

    console.log("Received data:", {
      reportDate,
      subject,
      testSource,
      testCount,
      studyDuration,
      ghalamchiScore,
      description,
      imageUrl,
    });

    // Validate required fields - testSource is now optional
    if (
      !reportDate ||
      !subject ||
      testCount === undefined ||
      studyDuration === undefined
    ) {
      return Response.json(
        {
          error: "فیلدهای تاریخ، درس، تعداد تست و مدت مطالعه الزامی است",
        },
        { status: 400 },
      );
    }

    // Validate data types and ranges
    const testCountNum = parseInt(testCount);
    const studyDurationNum = parseInt(studyDuration);
    const ghalamchiScoreNum = ghalamchiScore ? parseInt(ghalamchiScore) : null;

    if (isNaN(testCountNum) || testCountNum < 0) {
      return Response.json(
        { error: "تعداد تست باید عدد مثبت باشد" },
        { status: 400 },
      );
    }

    if (isNaN(studyDurationNum) || studyDurationNum < 0) {
      return Response.json(
        { error: "مدت مطالعه باید عدد مثبت باشد" },
        { status: 400 },
      );
    }

    if (ghalamchiScore && (isNaN(ghalamchiScoreNum) || ghalamchiScoreNum < 0)) {
      return Response.json(
        { error: "تراز قلمچی باید عدد مثبت باشد" },
        { status: 400 },
      );
    }

    // Get user info
    const userQuery = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (userQuery.length === 0) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    const currentUser = userQuery[0];

    // Create report - allow multiple reports per day per subject
    const newReport = await sql`
      INSERT INTO daily_reports (
        user_id, report_date, subject, test_source, test_count, 
        study_duration, ghalamchi_score, description, status, image_url
      ) 
      VALUES (
        ${currentUser.id}, ${reportDate}, ${subject}, ${testSource || null}, 
        ${testCountNum}, ${studyDurationNum}, 
        ${ghalamchiScoreNum}, 
        ${description || null}, 'pending', ${imageUrl || null}
      ) 
      RETURNING *
    `;

    console.log("Report created successfully:", newReport[0]);

    return Response.json({
      message: "گزارش با موفقیت ثبت شد",
      report: newReport[0],
    });
  } catch (error) {
    console.error("Create report error:", error);
    return Response.json(
      { error: "خطای سرور در ثبت گزارش: " + error.message },
      { status: 500 },
    );
  }
}
