// server/services/mpesaService.js
class MpesaService {
    constructor() {
      this.consumerKey = process.env.MPESA_CONSUMER_KEY;
      this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
      this.passkey = process.env.MPESA_PASSKEY;
      this.shortcode = process.env.MPESA_SHORTCODE; // Your till number
      this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    }
    
    // Generate access token
    async getAccessToken() {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        headers: { Authorization: `Basic ${auth}` }
      });
      return response.data.access_token;
    }
    
    // STK Push (user initiates payment from their phone)
    async initiateSTKPush(phoneNumber, amount, accountReference) {
      const token = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
      
      const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: this.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: 'BetFusion Deposit'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    }
    
    // Till Number Payment (user sends to till)
    async confirmTillPayment(transactionId) {
      // This would be called by M-Pesa callback
      // Verify payment and credit user account
      const user = await User.findOne({ phoneNumber: transactionData.phoneNumber });
      user.balance += transactionData.amount;
      await user.save();
      
      return { success: true, newBalance: user.balance };
    }
  }