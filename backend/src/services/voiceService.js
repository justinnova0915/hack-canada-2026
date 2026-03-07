exports.generateScript = (ingredients, recipe) => {
    return `I detected ${ingredients.join(', ')} in your fridge. I recommend making ${recipe.title}. ${recipe.message}`;
};

exports.generateAudio = async (text) => {
    // For the hackathon, returning a valid public audio file url or base64
    // Usually this would call ElevenLabs API and stream back the response.
    return {
       text_used: text,
       audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    };
};
