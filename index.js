var quotes = [
  "_**Good job!**_",
  "_**LGTM**_",
  "_**Great work**_",
  "_**Well done!**_",
  "_**Congratulations!**_",
  "_**Good for you!**_",
  "_**I knew you could do it!**_",
  "_**Good idea!**_",
  "_**You rule!**_",
  "_**That’s the way to go! You did it!**_",
  "_**You’ve got it!**_",
  "_**Keep it up!**_",
  "_**You are doing great!**_",
  "_**Better than ever!**_",
  "_**I’m proud of you!**_",
  "_**You’re very talented!**_",
  "_**Great! Go ahead!**_",
  "_**Very good!**_",
  "_**I like that!**_",
  "_**You've made a lot of progress!**_",
  "_**You’ve outdone yourself!**_",
  "_**I knew you could handle**_"
];

module.exports = app => {
  app.on("pull_request.closed", pull_request_closed);

  async function pull_request_closed(context) {
    app.log("pull_request_closed");

    var res = JSON.parse(JSON.stringify(context));
    app.log("---------------------WOW----------------------------");
    
    app.log(res.payload.pull_request.merged);
    var merged = res.payload.pull_request.merged;

    if (merged == true) {
      app.log("GREAT!");
      var quote = quotes[Math.floor(Math.random() * quotes.length)];
      context.octokit.issues.createComment(context.issue({ body: quote }));
    } else {
      app.log("FOO!");
    }
    app.log("---------------------WOW----------------------------");
    app.log(context);
    app.log("-------------------------------------------------");
  }
};
