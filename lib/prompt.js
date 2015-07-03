import inquirer from 'inquirer';
import B from 'bluebird';

let persistentResponse;

let prompt = B.promisify(function (question, cb) {
  inquirer.prompt(question, function (responses) {
    cb(null, responses);
  });
});

const fixItQuestion = {
  type: "list",
  name: "confirmation",
  message: "Fix it:",
  choices: [ "yes", "no", "always", "never"],
  filter: function ( val ) { return val.toLowerCase(); }
};

async function fixIt () {
  if (persistentResponse) {
    return persistentResponse;
  }
  let resp = await prompt(fixItQuestion);
  persistentResponse = resp.confirmation === 'always' ? 'yes' : persistentResponse;
  persistentResponse = resp.confirmation === 'never' ? 'no' : persistentResponse;
  return persistentResponse || resp.confirmation;
}

export { fixIt };

