
export const welcomeEmployee = ({ name,email }) => {
    let image = "https://kingster-dev-public.s3.ap-south-1.amazonaws.com/video/30217443471219619352.png"
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Mindfin</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 5px;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            padding: 20px;
            text-align: left;
            color: #999;
            font-size: 14px;
            border-bottom: 1px solid #eee;
        }
        .logo-container {
            text-align: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        .logo {
            width: 180px;
            height: auto;
        }
        .logo-dimensions {
            display: block;
            text-align: center;
            background-color: #2684FF;
            color: white;
            padding: 5px;
            width: 100px;
            margin: 10px auto;
            border-radius: 3px;
            font-size: 12px;
        }
        .content {
            padding: 20px 40px;
        }
        h1 {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
        }
        p {
            font-size: 14px;
            line-height: 1.6;
            color: #555;
            margin-bottom: 15px;
        }
        .button {
            display: inline-block;
            background-color: #2684FF;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            font-size: 12px;
            color: #777;
            padding: 20px 40px;
            border-top: 1px solid #eee;
        }
        .copyright {
            text-align: left;
            font-size: 12px;
            color: #999;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        
        <div class="logo-container">
            <img src="${image}" alt="Mindfin Logo" class="logo">
        </div>
        <div class="content">
            <h1>Welcome to Mindfin!</h1>
            <p>Hi ${name},</p>
            <p>We're glad to have you onboard! You're already on your way to creating beautiful journey with us.</p>
            <p>We are inviting you to join our team by creating password and login to respective dashboard with this user id <a href="mailto:rahul@mindfin.com">${email}</a>.</p>
            <p>Thanks,<br>Mindfin Team</p>
            <a href="https://mindfin-frontend.vercel.app/generate-password" class="button">Generate Password</a>
        </div>
        <div class="footer">
            <p>This email was sent to <a href="mailto:hr@mindfin.com">hr@mindfin.com</a>. You have received this mail because your e-mail ID is registered with us. This is a system-generated e-mail regarding your Mindfin account preferences, please don't reply to this message.</p>
            <div class="copyright">Copyright Mindfin 2025. All rights reserved</div>
        </div>
    </div>
</body>
</html>
    `
}

export const Otp = ({name , otpDigits}) =>{

    console.log(otpDigits,"gigi");
    

    let image = "https://kingster-dev-public.s3.ap-south-1.amazonaws.com/video/30217443471219619352.png"


    return `
    <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            color: #777;
        }
        .heanding{
       color: #333;

         }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 20px;
        }
        .code-container {
            display: flex;
            justify-content: center;
            margin: 30px 0;
        }
        .code-box {
            display: inline-block;
            width: 50px;
            height: 50px;
            margin: 0 5px;
            border: 1px solid #ccc;
            border-radius: 5px;
            text-align: center;
            line-height: 50px;
            font-size: 24px;
            font-weight: bold;
        }
        .instructions {
            margin-bottom: 30px;
        }
        .footer {
            font-size: 12px;
            color: #777;
            margin-top: 10px;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${image}" alt="Company Logo" class="logo">
    </div>
    
    <h1 class="heanding">verification code!</h1>
    
    <p>Hi ${name},</p>
    
    <p>This is your verification code</p>
    
    <div class="code-container">
        <div class="code-box">${otpDigits[0]}</div>
        <div class="code-box">${otpDigits[1]}</div>
        <div class="code-box">${otpDigits[2]}</div>
        <div class="code-box">${otpDigits[3]}</div>
    </div>
    
    <p class="instructions">Use the above code to reset your password in the respective user dashboard of Mindfin.</p>
    
    <p>Thanks,<br>Mindfin Team</p>
    
    <div class="footer">
        <p>This email was sent to <a href="mailto:[EMAIL]">hr@mindfin.com</a>. You have received this mail because your e-mail ID is registered with us. This is a system-generated e-mail regarding your Mindfin account preferences, please don't reply to this message.</p>
        <p>Copyright Mindfin 2025. All rights reserved</p>
    </div>
</body>
</html>
    
    `
}

export const leaveApprovel = ({employeename,startDate,endDate,Officername,officerDesignation}) =>{

    let image = "https://kingster-dev-public.s3.ap-south-1.amazonaws.com/video/30217443471219619352.png"


    return `
    
    <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leave Approval Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            color: #777;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 20px;
			 color: #333;

        }
        .content {
            line-height: 1.6;
        }
        .signature {
            margin-top: 20px;
        }
        .footer {
            font-size: 12px;
            color: #777;
            margin-top: 50px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${image}" alt="Company Logo" class="logo">
    </div>
    
    <h1>Leave approved!</h1>
    
    <div class="content">
        <p>Dear ${employeename},</p>
        
        <p>I hope you're doing well. I'm writing to inform you that your leave request from  ${startDate} to  ${endDate} has been approved.</p>
        
        <p>Please ensure that all pending tasks are either completed before your leave or delegated appropriately. If you need any further assistance, feel free to reach out.</p>
        
        <div class="signature">
            <p>Have a great time off!<br>
            Best regards,<br>
             ${Officername}<br>
             ${officerDesignation}<br>
            Mindfin</p>
        </div>
    </div>
    
    <div class="footer">
        <p>This email was sent to <a href="mailto:[EMAIL]">hr@mindfin.com</a>. You have received this mail because your e-mail ID is registered with us. This is a system-generated e-mail regarding your mindfin account preferences, please don't reply to this message.</p>
        <p>Copyright mindfin 2025. All rights reserved</p>
    </div>
</body>
</html>
    `
}

export const leaveReject = ({employeename,startDate,Officername,officerDesignation}) =>{

    let image = "https://kingster-dev-public.s3.ap-south-1.amazonaws.com/video/30217443471219619352.png"


    return `
    <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leave Rejection Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 20px;
        }
        .content {
            line-height: 1.6;
        }
        .signature {
            margin-top: 20px;
        }
        .footer {
            font-size: 12px;
            color: #777;
            margin-top: 50px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${image}" alt="Company Logo" class="logo">
    </div>
    
    <h1>Leave Rejected!</h1>
    
    <div class="content">
        <p>Dear ${employeename},</p>
        
        <p>I hope you're doing well. This email is to inform you that your leave application for ${startDate} has been reviewed and, unfortunately, we are unable to approve it at this time due to some reasons</p>
        
        <div class="signature">
            <p>Best regards,<br>
            ${Officername}<br>
             ${officerDesignation}<br>
            Mindfin</p>
        </div>
    </div>
    
    <div class="footer">
        <p>This email was sent to <a href="mailto:[EMAIL]">hr@mindfin.com</a>. You have received this mail because your e-mail ID is registered with us. This is a system-generated e-mail regarding your mindfin account preferences, please don't reply to this message.</p>
        <p>Copyright mindfin 2025. All rights reserved</p>
    </div>
</body>
</html>
    
    
    `

    
}

export const bdayRequest =({name}) =>{

    let image = "https://kingster-dev-public.s3.ap-south-1.amazonaws.com/video/30217443471219619352.png"
    let BDAYimage = "https://kingster-dev-public.s3.ap-south-1.amazonaws.com/video/84317443612089191595.png"


    return `
    <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Birthday Wishes</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            text-align: center;
        }
        .header {
            margin-bottom: 20px;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        .birthday-image {
            margin: 20px 0;
            max-width: 300px;
        }
        h1 {
            font-size: 28px;
            margin-bottom: 20px;
        }
        .message {
            line-height: 1.6;
            margin-bottom: 30px;
            text-align: left;
        }
        .signature {
            margin-top: 20px;
      	   text-align: left;

        }
        .footer {
            font-size: 12px;
            color: #777;
            margin-top: 50px;
            border-top: 1px solid #eee;
            padding-top: 20px;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${image}" alt="Company Logo" class="logo">
    </div>
    
    <img src="${BDAYimage}" alt="Birthday Cake" class="birthday-image">
    
    <h1>Happy Birthday, ${name}</h1>
    
    <div class="message">
        <p>On behalf of everyone at Mindfin, we want to wish you a very happy birthday! We appreciate your hard work and dedication to the team. May your day be filled with joy and celebration.</p>
    </div>
    
    <div class="signature">
        <p>Thanks,<br>
        mindfin Team</p>
    </div>
    
    <div class="footer">
        <p>This email was sent to <a href="mailto:[EMAIL]">hr@mindfin.com</a>. You have received this mail because your e-mail ID is registered with us. This is a system-generated e-mail regarding your mindfin account preferences, please don't reply to this message.</p>
        <p>Copyright mindfin 2025. All rights reserved</p>
    </div>
</body>
</html>
    
    `
}

