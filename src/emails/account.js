const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'kokabkokabi1234@gmail.com',
        subject: 'Welcome',
        text: `Hey ${name}! Glad to have you on board!`
    })
}

const sendFarewellEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'kokabkokabi1234@gmail.com',
        subject: 'Farewell',
        text: `Bye bye ${name}! Hope to see you back sometime soon!`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendFarewellEmail
}