const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');

async function detectIntent(
  projectId,
  sessionId,
  query,
  contexts,
  languageCode,
  credentialsFile
) {
  const sessionClient = new dialogflow.SessionsClient({
    projectId,
    keyFilename: credentialsFile
  });
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: languageCode,
      },
    },
  };

  if (contexts && contexts.length > 0) {
    request.queryParams = {
      contexts: contexts,
    };
  }

  const responses = await sessionClient.detectIntent(request);
  return responses[0];
}

async function sendQueries(projectId, sessionId, text, languageCode, credentialsFile) {
  let context;
  let intentResponse = await detectIntent(
    projectId,
    sessionId,
    text,
    context,
    languageCode,
    credentialsFile
  );
  return intentResponse;
}


module.exports.sendQueries = sendQueries;