# Paystack Integration for IFFA Health

## Overview
This document outlines the Paystack payment integration for the IFFA Health mobile application. The integration allows patients to pay for appointments during the booking process using various payment methods supported by Paystack.

## Features
- **Payment Initialization**: Initialize payments with Paystack
- **Payment Verification**: Verify payment status after completion
- **Multiple Payment Methods**: Support for cards, bank transfers, and mobile money
- **Refund Processing**: Handle refunds for cancelled appointments
- **Payment History**: Track payment history for patients
- **Error Handling**: Comprehensive error handling and validation

## Configuration

### Environment Variables
```typescript
// Test Environment
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here

// Production Environment
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here
PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
```

### Currency
- **Primary Currency**: Ghana Cedi (GHS)
- **Amount Format**: Converted to kobo (smallest currency unit) for Paystack

## API Endpoints

### 1. Initialize Payment
**Endpoint**: `POST /api/payments/initialize`

**Request Body**:
```json
{
  "appointmentId": "apt_001",
  "amount": 15000,
  "email": "patient@example.com",
  "patientId": "patient_001",
  "doctorId": "doc_001",
  "doctorName": "Dr. Sarah Mensah",
  "appointmentDate": "2024-01-20",
  "appointmentTime": "10:00"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/ACCESS_yeha5aeju",
    "access_code": "ACCESS_yeha5aeju",
    "reference": "TXN_1758431400951"
  }
}
```

### 2. Verify Payment
**Endpoint**: `GET /api/payments/verify/:reference`

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "success",
    "transactionId": "TXN_1758431404159",
    "amount": 150,
    "appointmentId": "apt_1758431404159"
  }
}
```

### 3. Create Appointment with Payment
**Endpoint**: `POST /api/appointments/book-with-payment`

**Request Body**:
```json
{
  "patientId": "patient_001",
  "doctorId": "doc_001",
  "date": "2024-01-20",
  "time": "10:00",
  "notes": "Payment completed via card",
  "paymentData": {
    "amount": 150,
    "email": "patient@example.com",
    "reference": "TXN_1758431400951"
  }
}
```

### 4. Get Payment History
**Endpoint**: `GET /api/payments/patient/:id/history`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "pay_001",
      "appointmentId": "apt_001",
      "amount": 150,
      "status": "completed",
      "date": "2024-01-15",
      "method": "card",
      "reference": "TXN_1234567890",
      "doctorName": "Dr. Sarah Mensah",
      "appointmentDate": "2024-01-20",
      "appointmentTime": "10:00"
    }
  ]
}
```

### 5. Process Refund
**Endpoint**: `POST /api/payments/:id/refund`

**Request Body**:
```json
{
  "reason": "Patient requested refund"
}
```

### 6. Get Payment Methods
**Endpoint**: `GET /api/payments/methods`

**Response**:
```json
{
  "success": true,
  "data": {
    "methods": [
      {
        "id": "card",
        "name": "Credit/Debit Card",
        "type": "card",
        "isActive": true
      },
      {
        "id": "bank_transfer",
        "name": "Bank Transfer",
        "type": "bank",
        "isActive": true
      },
      {
        "id": "mobile_money",
        "name": "Mobile Money",
        "type": "mobile_money",
        "isActive": true
      }
    ]
  }
}
```

## Payment Flow

### 1. Appointment Booking
1. Patient selects doctor and appointment details
2. Patient clicks "Proceed to Payment"
3. Navigate to PaymentScreen

### 2. Payment Process
1. Display appointment summary and fee
2. Show available payment methods
3. Patient selects payment method
4. Initialize payment with Paystack
5. Open Paystack checkout in browser
6. Patient completes payment
7. Verify payment status
8. Create appointment if payment successful

### 3. Payment Verification
1. Check payment status with Paystack
2. If successful, create appointment
3. If failed, show error message
4. Navigate to appointments list

## Implementation Details

### PaymentScreen Component
- **Location**: `mobile/src/screens/PaymentScreen.tsx`
- **Features**:
  - Appointment summary display
  - Payment method selection
  - Paystack integration
  - Error handling
  - Loading states

### PaystackService
- **Location**: `mobile/src/services/paystackService.ts`
- **Features**:
  - Payment initialization
  - Payment verification
  - Refund processing
  - Payment history
  - Data validation

### PaystackConfig
- **Location**: `mobile/src/config/paystack.ts`
- **Features**:
  - Environment configuration
  - Currency formatting
  - Validation functions
  - URL generation

## Error Handling

### Common Errors
1. **Invalid Amount**: Amount must be greater than 0
2. **Invalid Email**: Email format validation
3. **Network Error**: Connection issues
4. **Payment Failed**: Payment declined or failed
5. **Invalid Reference**: Transaction reference not found

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Security Considerations

### Data Protection
- Never store card details
- Use HTTPS for all API calls
- Validate all input data
- Implement proper error handling

### PCI Compliance
- Paystack handles PCI compliance
- No sensitive payment data stored locally
- Secure token-based authentication

## Testing

### Test Environment
- Use Paystack test keys
- Test with test card numbers
- Verify all payment flows
- Test error scenarios

### Test Card Numbers
```
Visa: 4084084084084081
Mastercard: 5555555555554444
Expiry: Any future date
CVV: Any 3 digits
```

## Production Deployment

### Checklist
- [ ] Replace test keys with production keys
- [ ] Update webhook URLs
- [ ] Test with real payment methods
- [ ] Implement proper logging
- [ ] Set up monitoring
- [ ] Configure error alerts

### Webhook Configuration
- **URL**: `https://api.iffahealth.com/webhooks/paystack`
- **Events**: `charge.success`, `charge.failed`, `refund.processed`
- **Security**: Verify webhook signatures

## Monitoring and Analytics

### Key Metrics
- Payment success rate
- Average payment time
- Failed payment reasons
- Refund rate
- Revenue tracking

### Logging
- Payment initialization logs
- Payment verification logs
- Error logs
- Refund logs

## Support and Maintenance

### Common Issues
1. **Payment not initializing**: Check API keys and network
2. **Verification failing**: Check reference format
3. **Refund not processing**: Verify transaction ID
4. **Webhook not receiving**: Check URL configuration

### Contact Information
- **Paystack Support**: support@paystack.com
- **Technical Issues**: Contact development team
- **Business Issues**: Contact product team

## Changelog

### Version 1.0.0 (Current)
- Initial Paystack integration
- Payment initialization and verification
- Multiple payment methods support
- Refund processing
- Payment history tracking
- Comprehensive error handling

## Future Enhancements

### Planned Features
- Recurring payments for subscriptions
- Payment plans for expensive treatments
- Multi-currency support
- Advanced analytics dashboard
- Automated refund processing
- Payment reminders

### Integration Improvements
- Real-time payment status updates
- Enhanced error messages
- Payment retry mechanisms
- Offline payment support
- Biometric authentication
