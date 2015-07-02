import inquirer from 'inquirer';
import B from 'bluebird';

let persistenceResponse;

let prompt = B.promisify(function(question, cb) {
  inquirer.prompt(question, function(responses) {
    cb(null, responses);
  });
});

const doItQuestion = {
  type: "list",
  name: "confirmation",
  message: "Do it?",
  choices: [ "yes", "no", "always", "never"],
  filter: function( val ) { return val.toLowerCase(); }
};

async function doIt () {
  if (persistenceResponse) {
    return persistenceResponse;
  }
  let resp = await prompt(doItQuestion);
  persistenceResponse = resp.confirmation === 'always' ? 'yes' : persistenceResponse;
  persistenceResponse = resp.confirmation === 'never' ? 'no' : persistenceResponse;
  return persistenceResponse || resp.confirmation;
}

export { doIt };

