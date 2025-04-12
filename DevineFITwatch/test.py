import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

import flask
from flask_session import Session
import google_auth_oauthlib.flow
import googleapiclient.discovery
from datetime import datetime, timedelta

app = flask.Flask(__name__)
app.secret_key = 'RawiJIOJOAMLOWKOmsam'

# Session setup
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = True
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_FILE_DIR'] = os.path.join(os.getcwd(), 'flask_session')
os.makedirs(app.config['SESSION_FILE_DIR'], exist_ok=True)
Session(app)

SCOPES = ['https://www.googleapis.com/auth/fitness.activity.read']
REDIRECT_URI = 'http://localhost:8080/oauth2callback'
CLIENT_SECRET_FILE = 'cred.json'

@app.route('/')
def index():
    return 'Welcome! <a href="/authorize">Connect Google Fit</a>'

@app.route('/authorize')
def authorize():
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=SCOPES
    )
    flow.redirect_uri = REDIRECT_URI
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    flask.session['state'] = state
    print(f"[DEBUG] Saved state in session: {state}")
    return flask.redirect(authorization_url)

@app.route('/oauth2callback')
def oauth2callback():
    if 'state' not in flask.session:
        return "Session expired or invalid request. Please try again.", 400

    print(f"[DEBUG] Session state: {flask.session['state']}")
    print(f"[DEBUG] Query param state: {flask.request.args.get('state')}")

    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=SCOPES,
        state=flask.session['state']
    )
    flow.redirect_uri = REDIRECT_URI
    flow.fetch_token(authorization_response=flask.request.url)

    credentials = flow.credentials
    fitness_service = googleapiclient.discovery.build('fitness', 'v1', credentials=credentials)

    now = datetime.utcnow()
    start_time = int((now - timedelta(days=1)).timestamp() * 1000)
    end_time = int(now.timestamp() * 1000)

    # Use this merged data source
    data_source_id = "derived:com.google.step_count.delta:com.google.android.gms:merge_step_deltas"

    response = fitness_service.users().dataset().aggregate(
        userId="me",
        body={
            "aggregateBy": [{
                "dataSourceId": data_source_id
            }],
            "bucketByTime": {"durationMillis": 86400000},
            "startTimeMillis": start_time,
            "endTimeMillis": end_time
        }
    ).execute()

    steps = 0
    for bucket in response.get('bucket', []):
        for dataset in bucket.get('dataset', []):
            for point in dataset.get('point', []):
                steps += point['value'][0].get('intVal', 0)

    return f"<h1>Steps in the last 24 hours: {steps}</h1>"

if __name__ == '__main__':
    app.run(port=8080)
