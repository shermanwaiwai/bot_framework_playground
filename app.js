var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var DialogLabels = {
    Hotels: 'Hotels',
    Flights: 'Flights',
    LeaveApplication: 'LeaveApplication',
    Support: 'Support'
};

var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Welcome to the e-leave application");
        // builder.PromptChoice.
        builder.Prompts.choice(session, "leave type?", "AL|SL|OT", { listStyle: 3 });
        // builder.Prompts.time(session, "Please provide a reservation date and time (e.g.: June 6th at 5pm)");
    },
    function (session, results) {
        session.dialogData.leaveType = results.response.entity;
        builder.Prompts.time(session, "Start Date?");
    },
    function (session, results) {
        session.dialogData.StartDate = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.time(session, "End Date?");
    },
    function (session, results) {
        console.log(results);
        session.dialogData.EndDate = builder.EntityRecognizer.resolveTime([results.response]);
        session.send(`Application Detail details: <br/> Leave application: ${session.dialogData.leaveType} <br/> Date/Time: ${session.dialogData.StartDate} - ${session.dialogData.EndDate}`);
        builder.Prompts.confirm(session, "Are you sure you apply?");
    },
    function (session, results) {
        // var bool =  builder.EntityRecognizer.parseBoolean([results.response]);
        console.log(results);
        var bool = results.response;
        console.log(bool);
        if (bool) {
            session.send(`Your application has been successfully submited`);
        } else {
            session.send(`End application`);
        }
        // Process request and display reservation details
        session.endDialog();
    }
])

bot.dialog('greetings', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        // session.endDialog(`Hello ${ results.response }!`);
        session.replaceDialog('leave');
    }
]);

bot.dialog('flights', require('./flights'));
bot.dialog('hotels', require('./hotels'));
bot.dialog('leave', require('./leave'));
bot.dialog('support', require('./support'))
    .triggerAction({
        matches: [/help/i, /support/i, /problem/i]
    });

// log any bot errors into the console
bot.on('error', function (e) {
    console.log('And error ocurred', e);
});