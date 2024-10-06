const axios = require('axios').default;

const start = async(amount, mode, tel, transactionId, OTP = null ) => {
    const codeDohone = 'VN216Z0741083077833';
    const NotifUrl = 'https://0cc6689531a2.ngrok.io/webhook';
    if( mode == 2 ){
        return axios.get(
            'https://www.my-dohone.com/dohone/pay?cmd=start&rN=Entrecops&rDvs=XAF&rMt=' + amount + '&rMo=' + mode + '&rT=' + tel + '&rH=' + codeDohone + '&rI=' + transactionId + '&source=Entrecops&rOTP=' + OTP + '&notifyPage=' + NotifUrl
        );
    } else {
        return axios.get(
            'https://www.my-dohone.com/dohone/pay?cmd=start&rN=Entrecops&rDvs=XAF&rMt=' + amount + '&rMo=' + mode + '&rT=' + tel + '&rH=' + codeDohone + '&rI=' + transactionId + '&source=Entrecops&notifyPage=' + NotifUrl
        );
    }
}

module.exports = start;