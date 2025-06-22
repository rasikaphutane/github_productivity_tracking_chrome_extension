from textblob import TextBlob

def analyze_commit_sentiment(messages: list[str]):
    sentiments = []
    for msg in messages:
        polarity = TextBlob(msg).sentiment.polarity
        sentiments.append("positive" if polarity > 0 else "negative" if polarity < 0 else "neutral")
    return sentiments
