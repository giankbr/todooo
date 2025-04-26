import nodemailer from 'nodemailer';

// Define types for email data
interface TaskData {
  description: string;
  completed: boolean;
}

interface UpdateData {
  user: {
    name: string;
    email?: string;
  };
  project?: {
    name: string;
  };
  projectName?: string;
  tasks?: string; // JSON string of tasks
}

interface EmailData {
  [department: string]: UpdateData[];
}

interface ReportEmailParams {
  subject: string;
  data: EmailData;
  recipients?: string[]; // Optional override for recipients
}

// Configure your email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendReportEmail({ subject, data, recipients }: ReportEmailParams): Promise<boolean> {
  try {
    // Validate data
    if (!data || Object.keys(data).length === 0) {
      console.error('No data provided for report email');
      return false;
    }

    // Format the email content with modern, minimalist styling
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #334155;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        .header {
          padding: 28px 32px;
          background-color: #f1f5f9;
          border-bottom: 1px solid #e2e8f0;
        }
        .content {
          padding: 28px 32px;
        }
        h1 {
          color: #0f172a;
          margin: 0;
          font-weight: 600;
          font-size: 24px;
          line-height: 1.2;
        }
        .department {
          margin: 28px 0 16px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e2e8f0;
          color: #0f172a;
          font-size: 18px;
          font-weight: 500;
        }
        .dept-first {
          margin-top: 0;
        }
        .report-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .user-name {
          font-weight: 600;
          color: #0f172a;
          font-size: 16px;
        }
        .project-name {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .task-list {
          margin-top: 8px;
        }
        .task-item {
          display: flex;
          padding: 6px 0;
        }
        .task-status {
          margin-right: 8px;
          font-size: 16px;
          min-width: 20px;
        }
        .task-desc {
          font-size: 14px;
          margin: 0;
        }
        .completed {
          color: #10b981;
        }
        .pending {
          color: #94a3b8;
        }
        .empty-dept {
          color: #64748b;
          font-style: italic;
          padding: 12px;
          text-align: center;
          background: #f1f5f9;
          border-radius: 6px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #64748b;
          font-size: 12px;
        }
        .logo {
          margin-bottom: 8px;
        }
        @media only screen and (max-width: 480px) {
          body {
            padding: 10px;
          }
          .header, .content {
            padding: 20px;
          }
          h1 {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
        </div>
        <div class="content">
          ${Object.entries(data)
            .map(
              ([dept, updates], index) => `
            <div class="department ${index === 0 ? 'dept-first' : ''}">
              ${dept}
            </div>
            ${
              updates.length > 0
                ? updates
                    .map((update) => {
                      // Safely parse tasks
                      let taskList: TaskData[] = [];
                      try {
                        taskList = JSON.parse(update.tasks || '[]');
                      } catch (e) {
                        console.error('Error parsing tasks:', e);
                      }

                      const projectName = update.project?.name || update.projectName || 'No project';

                      return `
                    <div class="report-card">
                      <div class="user-name">${update.user.name}</div>
                      <div class="project-name">${projectName}</div>
                      ${
                        taskList.length > 0
                          ? `<div class="task-list">
                              ${taskList
                                .map(
                                  (task) =>
                                    `<div class="task-item">
                                      <div class="task-status ${task.completed ? 'completed' : 'pending'}">${task.completed ? '✓' : '○'}</div>
                                      <div class="task-desc">${task.description}</div>
                                    </div>`
                                )
                                .join('')}
                            </div>`
                          : '<div class="empty-dept">No tasks recorded</div>'
                      }
                    </div>
                  `;
                    })
                    .join('')
                : '<div class="empty-dept">No updates for this department</div>'
            }
          `
            )
            .join('')}
        </div>
      </div>
      <div class="footer">
        <div class="logo">MorfoTasks</div>
        <p>This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </body>
    </html>
    `;

    // Get team leads from environment variable or use provided recipients
    const teamLeadEmails = recipients || process.env.TEAM_LEAD_EMAILS?.split(',') || [];

    // Validate that we have recipients
    if (!teamLeadEmails.length) {
      console.error('No recipients specified for report email');
      return false;
    }

    // Filter invalid emails
    const validEmails = teamLeadEmails.filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));

    if (validEmails.length === 0) {
      console.error('No valid email addresses found in recipients');
      return false;
    }

    // Use the correct domain for the FROM address
    const fromEmail = process.env.EMAIL_FROM || 'noreply@mogiapp.id';

    // Send email
    const info = await transporter.sendMail({
      from: fromEmail,
      to: validEmails.join(','),
      subject,
      html: htmlContent,
      // Add plaintext alternative for better deliverability
      text: generatePlainText(subject, data),
    });

    console.log('Report email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send report email:', error);
    return false;
  }
}

// Generate plain text version for email clients that don't support HTML
function generatePlainText(subject: string, data: EmailData): string {
  let plainText = `${subject}\n\n`;

  Object.entries(data).forEach(([dept, updates]) => {
    plainText += `${dept}\n${'-'.repeat(dept.length)}\n\n`;

    if (updates.length === 0) {
      plainText += 'No updates for this department\n\n';
      return;
    }

    updates.forEach((update) => {
      const projectName = update.project?.name || update.projectName || 'No project';
      plainText += `* ${update.user.name} (${projectName}):\n`;

      try {
        const tasks: TaskData[] = JSON.parse(update.tasks || '[]');
        tasks.forEach((task) => {
          plainText += `  ${task.completed ? '[DONE]' : '[TODO]'} ${task.description}\n`;
        });
      } catch (e) {
        plainText += '  Unable to parse tasks\n';
      }

      plainText += '\n';
    });
  });

  plainText += 'This is an automated email from the MorfoTasks. Please do not reply directly to this email.';

  return plainText;
}

export async function verifyEmailConfig(): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('Email configuration is incomplete');
    return false;
  }

  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
}
