import nodemailer from 'nodemailer';

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

export async function sendReportEmail({ subject, data }) {
  // Format the email content
  const htmlContent = `
    <h1>${subject}</h1>
    ${Object.entries(data)
      .map(
        ([dept, updates]) => `
      <h2>${dept}</h2>
      <ul>
        ${updates
          .map(
            (update) => `
          <li>
            <strong>${update.user.name}</strong>: 
            ${update.project?.name || update.projectName || 'No project'} - 
            ${JSON.parse(update.tasks || '[]')
              .map((task) => `${task.completed ? '✅' : '◻️'} ${task.description}`)
              .join('<br>')}
          </li>
        `
          )
          .join('')}
      </ul>
    `
      )
      .join('')}
  `;

  // Get team leads from environment variable or database
  const teamLeadEmails = process.env.TEAM_LEAD_EMAILS?.split(',') || [];

  // Send email
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: teamLeadEmails.join(','),
    subject,
    html: htmlContent,
  });
}
