const axios = require('axios');
const apiUrl = 'https://slack.com/api';

const callAPIMethod = async (method, payload) => {
    let result = await axios.post(`${apiUrl}/${method}`, payload, {
    
        headers: { 
            Authorization: "Bearer xoxp-1301288377174-1306647213349-1315407075604-bbec7f6b4ebc601867f82ae4b5904e8d", 
            'Content-Type': 'application/json; charset=utf-8'
        }
    });
    return result.data;
}

module.exports = {
    callAPIMethod
}