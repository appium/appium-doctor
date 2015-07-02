import inquirer from 'inquirer';
import B from 'bluebird';

let persistentResponse;

let prompt = B.promisify(function (question, cb) {
  inquirer.prompt(question, function (responses) {
    cb(null, responses);
  });
});

const doItQuestion = {
  type: "list",
  name: "confirmation",
  message: "Do it?",
  choices: [ "yes", "no", "always", "never"],
  filter: function ( val ) { return val.toLowerCase(); }
};

async function doIt () {
  if (persistentResponse) {
    return persistentResponse;
  }
  let resp = await prompt(doItQuestion);
  persistentResponse = resp.confirmation === 'always' ? 'yes' : persistentResponse;
  persistentResponse = resp.confirmation === 'never' ? 'no' : persistentResponse;
  return persistentResponse || resp.confirmation;
}

export { doIt };

