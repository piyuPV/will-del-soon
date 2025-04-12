import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from flask import render_template, jsonify
import flask
from flask_session import Session
import google_auth_oauthlib.flow
import googleapiclient.discovery
from datetime import datetime, timedelta

# Flask app setup
app = flask.Flask(__name__)
app.secret_key = 'busabuuegfybjxjanisi'

# Configure server-side session
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = os.path.join(os.getcwd(), 'flask_sessions')
app.config['SESSION_PERMANENT'] = True
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_DOMAIN'] = False

if not os.path.exists(app.config['SESSION_FILE_DIR']):
    os.makedirs(app.config['SESSION_FILE_DIR'])

Session(app)

# Google Fit API setup
SCOPES = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.sleep.read'
]
REDIRECT_URI = 'http://localhost:8080/oauth2callback'
CLIENT_SECRET_FILE = 'cred.json'

sleep_stages = {
    1: "Awake",
    2: "Sleep",
    3: "Out-of-bed",
    4: "Light sleep",
    5: "Deep sleep",
    6: "REM"
}

def get_sleep_data(service, start_time_millis, end_time_millis):
    dataset = f"{start_time_millis}000000-{end_time_millis}000000"
    sleep_data = []
    try:
        response = service.users().dataSources().datasets().get(
            userId='me',
            dataSourceId='derived:com.google.sleep.segment:com.google.android.gms:merged',
            datasetId=dataset
        ).execute()

        for point in response.get('point', []):
            start = int(point['startTimeNanos']) / 1e6
            end = int(point['endTimeNanos']) / 1e6
            duration_minutes = (end - start) / 60000
            stage = point['value'][0]['intVal']
            sleep_data.append({
                'start': datetime.fromtimestamp(start / 1000).isoformat(),
                'end': datetime.fromtimestamp(end / 1000).isoformat(),
                'duration_minutes': duration_minutes,
                'stage': stage
            })

    except Exception as e:
        print(f"[ERROR] Sleep data fetch failed: {e}")
        response = {}

    print(f"[DEBUG] Raw sleep aggregate response: {response}")
    print(f"[DEBUG] Found {len(sleep_data)} sleep segments")
    return sleep_data

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

    state = flask.session['state']
    if state != flask.request.args.get('state'):
        return "State mismatch. Please try again.", 400

    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=SCOPES,
        state=state
    )
    flow.redirect_uri = REDIRECT_URI
    flow.fetch_token(authorization_response=flask.request.url)

    credentials = flow.credentials
    fitness_service = googleapiclient.discovery.build('fitness', 'v1', credentials=credentials)

    now = datetime.now()
    start_time_millis = int((now - timedelta(hours=36)).timestamp() * 1000)
    end_time_millis = int(now.timestamp() * 1000)

    # Get sleep data
    sleep_segments = get_sleep_data(fitness_service, start_time_millis, end_time_millis)
    total_sleep = sum(seg['duration_minutes'] for seg in sleep_segments)

    for seg in sleep_segments:
        print(f"Stage {seg['stage']} - {sleep_stages.get(seg['stage'], 'Unknown')} from {seg['start']} to {seg['end']} ({seg['duration_minutes']} mins)")

    # Aggregate steps + heart rate
    response = fitness_service.users().dataset().aggregate(
        userId="me",
        body={
            "aggregateBy": [
                {
                    "dataSourceId": "raw:com.google.step_count.delta:nl.appyhapps.healthsync:HealthSync - steps"
                },
                {
                    "dataTypeName": "com.google.heart_rate.bpm"
                }
            ],
            "bucketByTime": {"durationMillis": 86400000},
            "startTimeMillis": start_time_millis,
            "endTimeMillis": end_time_millis
        }
    ).execute()

    steps = 0
    heart_rates = []
    for bucket in response.get('bucket', []):
        for dataset in bucket.get('dataset', []):
            for point in dataset.get('point', []):
                data_type = point['dataTypeName']
                if data_type == 'com.google.step_count.delta':
                    steps += point['value'][0].get('intVal', 0)
                elif data_type == 'com.google.heart_rate.bpm':
                    heart_rates.append(point['value'][0].get('fpVal', 0.0))

    avg_hr = round(sum(heart_rates) / len(heart_rates), 2) if heart_rates else "N/A"

    print(f"[DEBUG] Total steps: {steps}")
    print(f"[DEBUG] Avg heart rate: {avg_hr}")

    flask.session['fit_data'] = {
        "steps": steps,
        "avg_heart_rate": avg_hr,
        "total_sleep_minutes": round(total_sleep, 2),
        "sleep_segments": sleep_segments
    }

    return render_template('index.html',
                           steps=steps,
                           avg_heart_rate=avg_hr,
                           total_sleep=round(total_sleep, 2),
                           sleep_segments=sleep_segments,
                           sleep_stages=sleep_stages)

@app.route('/data')
def get_data():
    data = flask.session.get('fit_data')
    if not data:
        return jsonify({"error": "No data available. Please authorize first."}), 400
    return jsonify(data)

if __name__ == '__main__':
    app.run(port=8080)
