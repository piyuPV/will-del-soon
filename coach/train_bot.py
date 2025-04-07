# train_chatbot.py
import json
import random
import pickle
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
import nltk

nltk.download('punkt')
nltk.download('wordnet')

lemmatizer = WordNetLemmatizer()

# Load intents
with open('intents.json', encoding='utf-8') as file:
    data = json.load(file)

corpus = []
labels = []

for intent in data['intents']:
    for pattern in intent['patterns']:
        tokens = word_tokenize(pattern)
        tokens = [lemmatizer.lemmatize(w.lower()) for w in tokens]
        corpus.append(" ".join(tokens))
        labels.append(intent['tag'])

# Vectorize text
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(corpus)

# Encode labels
unique_labels = list(set(labels))
label_map = {label: i for i, label in enumerate(unique_labels)}
y = np.array([label_map[label] for label in labels])

# Train model
model = MultinomialNB()
model.fit(X, y)

# Save model and vectorizer
with open('chatbot_model.pkl', 'wb') as f:
    pickle.dump(model, f)
with open('vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)

# Save label map
with open('labels.pkl', 'wb') as f:
    pickle.dump(unique_labels, f)

print("✅ Model and vectorizer saved!")
