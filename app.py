from flask import Flask, request, jsonify, render_template
import pandas as pd
from sentence_transformers import SentenceTransformer, util
import json
import pickle

app = Flask(__name__)

# Load the model from the pickle file
with open('models/sent_transform.pkl', 'rb') as f:
    model = pickle.load(f)

# Load the emoji data
df_emojis = pd.read_csv("models/emoji.csv")

# Function to convert string representations of arrays to actual arrays
def convert_to_array(embedding_str):
    return json.loads(embedding_str)

# Convert string representations of arrays to actual arrays
df_emojis['name_embeddings'] = df_emojis['name_embeddings'].apply(convert_to_array)
df_emojis['mean_embeddings'] = df_emojis['mean_embeddings'].apply(convert_to_array)



@app.route('/')
def home():
    return render_template('index.html')

@app.route('/process_input', methods=['POST'])
def process_input():
    if request.method == 'POST':
        data = request.json
        sentence = data.get('sentence', '')


        # Encode the input sentence
        query = model.encode([sentence])

        # Calculate cosine similarity scores from name embeddings
        df_emojis['name_score'] = df_emojis['name_embeddings'].apply(lambda x: util.cos_sim(torch.tensor(x), query[0])[0][0].item())
        df_name = df_emojis[['emojis', 'emojiNames', 'name_score']].sort_values('name_score', ascending=False).head(5)
      

        # Calculate cosine similarity scores from meaning embeddings
        df_emojis['mean_score'] = df_emojis['mean_embeddings'].apply(lambda x: util.cos_sim(torch.tensor(x), query[0])[0][0].item())
        df_mean = df_emojis[['emojis', 'emojiNames', 'mean_score']].sort_values('mean_score', ascending=False).head(5)

        # df_emojis.drop(['name_score', 'mean_score'], axis=1, inplace=True)

        # Merge the dataframes and calculate the maximum score
        final_df = pd.merge(df_name, df_mean, on=['emojis', 'emojiNames'], how='outer')
        final_df['score'] = final_df[['name_score', 'mean_score']].max(axis=1)
        final_df.drop(['name_score', 'mean_score'], axis=1, inplace=True)
        final_df = final_df.sort_values('score', ascending=False)

        # Extract the first 3 emojis along with 'emojiNames' and 'name_score'
        emojis_with_details = final_df[['emojis', 'emojiNames', 'score']].head(3).to_dict(orient='records')
        # print(emojis_with_details)
        return jsonify({'emojis': emojis_with_details})
    

@app.route('/add_emoji', methods=['POST'])
def add_emoji():

    global df_emojis


    data = request.json
    emoji=data.get('emoji', '')
    emoji_name = data.get('emojiName', '')
    emoji_meaning = data.get('emojiMeaning', '')

    if emoji_name and emoji_meaning:
        # Encode emoji meaning using the model
        embedding = model.encode([emoji_meaning])[0]
        embedding = '[' + ', '.join(map(str, embedding)) + ']'
        embedding = convert_to_array(embedding)
        
        embedding1 = model.encode([emoji_name])[0]
        embedding1 = '[' + ', '.join(map(str, embedding1)) + ']'
        embedding1 = convert_to_array(embedding1)

        # Add the new emoji to the DataFrame
        new_row = {'emojis':emoji,'emojiNames': emoji_name, 'final_emoji_meaning': emoji_meaning, 'mean_embeddings': embedding,'name_embeddings': embedding1}
        
        new_df = pd.DataFrame([new_row])

        # Concatenate the new DataFrame with the existing df_emojis DataFrame
        df_emojis = pd.concat([df_emojis, new_df], ignore_index=True)

        # Save the updated DataFrame to CSV
        df_emojis.to_csv("models/emoji.csv", index=False)

        return jsonify({'message': 'Emoji added successfully'})
    else:
        return jsonify({'error': 'Emoji name and meaning are required'})

if __name__ == '__main__':
    app.run(debug=True)
