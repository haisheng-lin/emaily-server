const mongoose = require('mongoose');

const requireLogin = require('../middlewares/requireLogin');
const requireCredits = require('../middlewares/requireCredits');
const Mailer = require('../services/Mailer');
const surveyTemplate = require('../services/emailTemplates/surveyTemplate');

const Survey = require('../models/Survey');

module.exports = async (app) => {

  app.get('/api/surveys/thanks', (req, res) => {
    res.send('Thanks for voting!');
  });

  app.post('/api/surveys', requireLogin, requireCredits, async (req, res) => {
    console.log('back-end received your req!');
    const { title, subject, body, recipients } = req.body;
    const survey = new Survey({
      title: title,
      subject: subject,
      body: body,
      recipients: recipients.split(',').map(email => ({ email: email.trim() })),
      _user: req.user.id,
      dateSent: Date.now()
    });

    // great place to send email
    const mailer = new Mailer(survey, surveyTemplate(survey));

    try {
      await mailer.send();
      // only save the survey after the email successfully sent
      await survey.save();
      req.user.credits -= 1;
      const user = await req.user.save();
      res.send(user);
    } catch(err) {
      res.status(422).send(err);
    }
  });
};