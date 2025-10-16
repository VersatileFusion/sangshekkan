import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const reportId = params.id;
    const { status, advisorFeedback } = await request.json();

    // Get user info
    const userQuery = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (userQuery.length === 0) {
      return Response.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const currentUser = userQuery[0];
    const isAdvisor = currentUser.role === 'advisor' || session.user.email === 'melika.sangshakan@advisor.com';

    if (!isAdvisor) {
      return Response.json({ error: 'فقط مشاور می‌تواند گزارش را بررسی کند' }, { status: 403 });
    }

    // Get the report
    const reportQuery = await sql`
      SELECT dr.*, u.name as user_name, u.phone as user_phone
      FROM daily_reports dr
      LEFT JOIN users u ON dr.user_id = u.id
      WHERE dr.id = ${reportId}
    `;

    if (reportQuery.length === 0) {
      return Response.json({ error: 'گزارش یافت نشد' }, { status: 404 });
    }

    const report = reportQuery[0];

    // Update report
    const updatedReport = await sql`
      UPDATE daily_reports 
      SET 
        status = ${status || report.status},
        advisor_feedback = ${advisorFeedback || report.advisor_feedback},
        approved_by = ${currentUser.id},
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = ${reportId}
      RETURNING *
    `;

    // Send notification to student
    try {
      let notificationMessage = `${report.user_name} عزیز، گزارش ${report.subject} مورخ ${report.report_date} `;
      
      if (status === 'approved') {
        notificationMessage += 'تایید شد.';
      } else if (status === 'rejected') {
        notificationMessage += 'رد شد.';
      }
      
      if (advisorFeedback) {
        notificationMessage += `\nبازخورد مشاور: ${advisorFeedback}`;
      }
      
      notificationMessage += '\nسامانه مطالعه - خانم سنگ‌شکن';
      
      console.log(`SMS to ${report.user_phone}: ${notificationMessage}`);
      // await sendSMS(report.user_phone, notificationMessage);
      
      // Also create in-app notification
      await sql`
        INSERT INTO notifications (user_id, title, message, type, related_id)
        VALUES (
          ${report.user_id},
          'بررسی گزارش',
          ${notificationMessage},
          'report_feedback',
          ${reportId}
        )
      `;
      
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    return Response.json({ 
      message: 'گزارش با موفقیت بروزرسانی شد',
      report: updatedReport[0]
    });

  } catch (error) {
    console.error('Update report error:', error);
    return Response.json({ error: 'خطای سرور در بروزرسانی گزارش' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const reportId = params.id;

    // Get user info
    const userQuery = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (userQuery.length === 0) {
      return Response.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const currentUser = userQuery[0];

    // Get the report to check ownership
    const reportQuery = await sql`
      SELECT * FROM daily_reports WHERE id = ${reportId}
    `;

    if (reportQuery.length === 0) {
      return Response.json({ error: 'گزارش یافت نشد' }, { status: 404 });
    }

    const report = reportQuery[0];
    const isAdvisor = currentUser.role === 'advisor' || session.user.email === 'melika.sangshakan@advisor.com';

    // Check permissions - only owner or advisor can delete
    if (report.user_id !== currentUser.id && !isAdvisor) {
      return Response.json({ error: 'شما اجازه حذف این گزارش را ندارید' }, { status: 403 });
    }

    // Delete report (files will be deleted by CASCADE)
    await sql`DELETE FROM daily_reports WHERE id = ${reportId}`;

    return Response.json({ message: 'گزارش با موفقیت حذف شد' });

  } catch (error) {
    console.error('Delete report error:', error);
    return Response.json({ error: 'خطای سرور در حذف گزارش' }, { status: 500 });
  }
}