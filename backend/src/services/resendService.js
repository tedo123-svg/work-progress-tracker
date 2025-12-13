import { Resend } from 'resend';
import crypto from 'crypto';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 6-digit verification code
export const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send verification email using Resend
export const sendVerificationEmail = async (email, code, username) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ Resend API key not configured');
      return { success: false, error: 'Email service not configured' };
    }

    // Smart email routing for development vs production
    let recipientEmail = email;
    let emailNote = '';
    
    // Check if we should use development mode
    const isDevelopmentMode = process.env.RESEND_TEST_EMAIL && process.env.NODE_ENV !== 'production';
    
    if (isDevelopmentMode) {
      recipientEmail = process.env.RESEND_TEST_EMAIL;
      emailNote = `<div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; margin: 10px 0; border-radius: 6px; font-size: 12px; color: #92400e;">
        <strong>Development Mode:</strong> This email was intended for <strong>${email}</strong> but redirected to your test email for development purposes.
      </div>`;
      console.log(`📧 Development mode: Redirecting email from ${email} to ${recipientEmail}`);
    } else {
      console.log(`📧 Production mode: Sending email directly to ${email}`);
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [recipientEmail],
      subject: 'Work Progress Tracker - Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
            .logo { color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; }
            .subtitle { color: #e2e8f0; font-size: 14px; margin: 5px 0 0 0; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #2d3748; margin-bottom: 20px; }
            .message { font-size: 16px; color: #4a5568; line-height: 1.6; margin-bottom: 30px; }
            .code-container { background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .code { font-size: 36px; font-weight: bold; color: #4c51bf; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 0; }
            .code-label { font-size: 14px; color: #718096; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
            .expiry { background-color: #fed7d7; color: #c53030; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; margin: 20px 0; }
            .security-note { background-color: #e6fffa; border-left: 4px solid #38b2ac; padding: 15px 20px; margin: 30px 0; }
            .security-note p { margin: 0; color: #2d3748; font-size: 14px; }
            .footer { background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer p { margin: 0; color: #718096; font-size: 12px; line-height: 1.5; }
            .powered-by { margin-top: 15px; font-size: 11px; color: #a0aec0; }
            @media (max-width: 600px) {
              .content { padding: 20px; }
              .code { font-size: 28px; letter-spacing: 4px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">🔐 Work Progress Tracker</h1>
              <p class="subtitle">Secure Login Verification</p>
            </div>
            
            <div class="content">
              ${emailNote}
              <h2 class="greeting">Hello ${username}!</h2>
              
              <p class="message">
                We received a login request for your Work Progress Tracker account. 
                To complete your login, please use the verification code below:
              </p>
              
              <div class="code-container">
                <div class="code-label">Your Verification Code</div>
                <div class="code">${code}</div>
              </div>
              
              <div class="expiry">
                ⏰ This code will expire in 10 minutes for your security.
              </div>
              
              <div class="security-note">
                <p><strong>Security Notice:</strong> If you didn't request this code, please ignore this email or contact your administrator immediately. Never share this code with anyone.</p>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated message from Work Progress Tracker.<br>
              Please do not reply to this email.</p>
              <p style="margin-top: 15px;">
                <strong>Need help?</strong> Contact your system administrator.
              </p>
              <p class="powered-by">Powered by Resend</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Work Progress Tracker - Verification Code
        
        Hello ${username}!
        
        We received a login request for your Work Progress Tracker account.
        To complete your login, please use the verification code below:
        
        Verification Code: ${code}
        
        This code will expire in 10 minutes for your security.
        
        If you didn't request this code, please ignore this email or contact your administrator.
        
        This is an automated message from Work Progress Tracker.
        Please do not reply to this email.
      `
    });

    if (error) {
      console.error('❌ Resend email sending failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Resend verification email sent:', data.id);
    
    return {
      success: true,
      messageId: data.id
    };
  } catch (error) {
    console.error('❌ Resend email sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send password reset email using Resend
export const sendPasswordResetEmail = async (email, newPassword, username) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ Resend API key not configured');
      return { success: false, error: 'Email service not configured' };
    }

    // Smart email routing for development vs production
    let recipientEmail = email;
    let emailNote = '';
    
    // Check if we should use development mode
    const isDevelopmentMode = process.env.RESEND_TEST_EMAIL && process.env.NODE_ENV !== 'production';
    
    if (isDevelopmentMode) {
      recipientEmail = process.env.RESEND_TEST_EMAIL;
      emailNote = `<div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; margin: 10px 0; border-radius: 6px; font-size: 12px; color: #92400e;">
        <strong>Development Mode:</strong> This email was intended for <strong>${email}</strong> but redirected to your test email for development purposes.
      </div>`;
      console.log(`📧 Development mode: Redirecting password reset email from ${email} to ${recipientEmail}`);
    } else {
      console.log(`📧 Production mode: Sending password reset email directly to ${email}`);
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [recipientEmail],
      subject: 'Work Progress Tracker - Password Reset Notification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center; }
            .logo { color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; }
            .subtitle { color: #fbb6ce; font-size: 14px; margin: 5px 0 0 0; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #2d3748; margin-bottom: 20px; }
            .message { font-size: 16px; color: #4a5568; line-height: 1.6; margin-bottom: 30px; }
            .credentials-container { background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%); border: 2px solid #fc8181; border-radius: 12px; padding: 30px; margin: 30px 0; }
            .credential-row { display: flex; justify-content: space-between; align-items: center; margin: 15px 0; padding: 10px 0; border-bottom: 1px solid #feb2b2; }
            .credential-row:last-child { border-bottom: none; }
            .credential-label { font-weight: 600; color: #742a2a; }
            .credential-value { font-family: 'Courier New', monospace; background-color: #ffffff; padding: 8px 12px; border-radius: 6px; color: #2d3748; font-weight: bold; }
            .warning { background-color: #fef5e7; border-left: 4px solid #f6ad55; padding: 15px 20px; margin: 30px 0; }
            .warning p { margin: 0; color: #744210; font-size: 14px; font-weight: 600; }
            .security-note { background-color: #e6fffa; border-left: 4px solid #38b2ac; padding: 15px 20px; margin: 30px 0; }
            .security-note p { margin: 0; color: #2d3748; font-size: 14px; }
            .footer { background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer p { margin: 0; color: #718096; font-size: 12px; line-height: 1.5; }
            .powered-by { margin-top: 15px; font-size: 11px; color: #a0aec0; }
            @media (max-width: 600px) {
              .content { padding: 20px; }
              .credential-row { flex-direction: column; align-items: flex-start; }
              .credential-value { margin-top: 5px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">🔑 Work Progress Tracker</h1>
              <p class="subtitle">Password Reset Notification</p>
            </div>
            
            <div class="content">
              ${emailNote}
              <h2 class="greeting">Hello ${username}!</h2>
              
              <p class="message">
                Your password has been reset by a system administrator. 
                Your new login credentials are provided below:
              </p>
              
              <div class="credentials-container">
                <div class="credential-row">
                  <span class="credential-label">Username:</span>
                  <span class="credential-value">${username}</span>
                </div>
                <div class="credential-row">
                  <span class="credential-label">New Password:</span>
                  <span class="credential-value">${newPassword}</span>
                </div>
              </div>
              
              <div class="warning">
                <p>⚠️ Please change this password after your first login for security purposes.</p>
              </div>
              
              <div class="security-note">
                <p><strong>Security Notice:</strong> If you didn't request this password reset, please contact your administrator immediately. Keep your new password secure and don't share it with anyone.</p>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated message from Work Progress Tracker.<br>
              Please do not reply to this email.</p>
              <p style="margin-top: 15px;">
                <strong>Need help?</strong> Contact your system administrator.
              </p>
              <p class="powered-by">Powered by Resend</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Work Progress Tracker - Password Reset Notification
        
        Hello ${username}!
        
        Your password has been reset by a system administrator.
        Your new login credentials are:
        
        Username: ${username}
        New Password: ${newPassword}
        
        Please change this password after your first login for security purposes.
        
        If you didn't request this password reset, please contact your administrator immediately.
        
        This is an automated message from Work Progress Tracker.
        Please do not reply to this email.
      `
    });

    if (error) {
      console.error('❌ Resend password reset email failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Resend password reset email sent:', data.id);
    
    return {
      success: true,
      messageId: data.id
    };
  } catch (error) {
    console.error('❌ Resend password reset email failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};