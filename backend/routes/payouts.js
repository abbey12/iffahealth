const express = require('express');
const router = express.Router();

// Mock database - in production, this would be a real database
let payoutRequests = [
  {
    id: '1',
    doctorId: 'doc_123',
    amount: 1500.00,
    currency: 'GHS',
    status: 'completed',
    requestedAt: '2024-01-15T10:30:00Z',
    processedAt: '2024-01-15T11:00:00Z',
    completedAt: '2024-01-15T14:30:00Z',
    method: {
      provider: 'MTN',
      number: '0241234567',
    },
    reference: 'PAY-2024-001',
  },
  {
    id: '2',
    doctorId: 'doc_123',
    amount: 2500.00,
    currency: 'GHS',
    status: 'processing',
    requestedAt: '2024-01-16T09:15:00Z',
    processedAt: '2024-01-16T09:45:00Z',
    method: {
      provider: 'Airtel',
      number: '0269876543',
    },
    reference: 'PAY-2024-002',
    estimatedCompletion: '2024-01-16T15:00:00Z',
  },
  {
    id: '3',
    doctorId: 'doc_123',
    amount: 800.00,
    currency: 'GHS',
    status: 'pending',
    requestedAt: '2024-01-17T08:20:00Z',
    method: {
      provider: 'MTN',
      number: '0241234567',
    },
    reference: 'PAY-2024-003',
    estimatedCompletion: '2024-01-17T12:00:00Z',
  },
  {
    id: '4',
    doctorId: 'doc_123',
    amount: 1200.00,
    currency: 'GHS',
    status: 'failed',
    requestedAt: '2024-01-14T16:45:00Z',
    processedAt: '2024-01-14T17:00:00Z',
    method: {
      provider: 'Vodafone',
      number: '0205555555',
    },
    reference: 'PAY-2024-004',
    failureReason: 'Invalid mobile money account',
  },
];

let payoutMethods = [
  {
    id: '1',
    doctorId: 'doc_123',
    type: 'mobile_money',
    provider: 'MTN',
    number: '0241234567',
    isDefault: true,
  },
  {
    id: '2',
    doctorId: 'doc_123',
    type: 'mobile_money',
    provider: 'Airtel',
    number: '0269876543',
    isDefault: false,
  },
];

// Get all payout requests for a doctor
router.get('/requests/:doctorId', (req, res) => {
  const { doctorId } = req.params;
  const requests = payoutRequests.filter(req => req.doctorId === doctorId);
  res.json(requests);
});

// Create a new payout request
router.post('/requests', (req, res) => {
  const { doctorId, amount, methodId } = req.body;
  
  // Find the payout method
  const method = payoutMethods.find(m => m.id === methodId && m.doctorId === doctorId);
  if (!method) {
    return res.status(400).json({ error: 'Payout method not found' });
  }

  // Generate reference number
  const reference = `PAY-${new Date().getFullYear()}-${String(payoutRequests.length + 1).padStart(3, '0')}`;
  
  const newRequest = {
    id: String(payoutRequests.length + 1),
    doctorId,
    amount,
    currency: 'GHS',
    status: 'pending',
    requestedAt: new Date().toISOString(),
    method: {
      provider: method.provider,
      number: method.number,
    },
    reference,
    estimatedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
  };

  payoutRequests.push(newRequest);
  res.status(201).json(newRequest);
});

// Cancel a payout request
router.patch('/requests/:requestId/cancel', (req, res) => {
  const { requestId } = req.params;
  const request = payoutRequests.find(req => req.id === requestId);
  
  if (!request) {
    return res.status(404).json({ error: 'Payout request not found' });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending requests can be cancelled' });
  }

  request.status = 'cancelled';
  res.json(request);
});

// Retry a failed payout request
router.patch('/requests/:requestId/retry', (req, res) => {
  const { requestId } = req.params;
  const request = payoutRequests.find(req => req.id === requestId);
  
  if (!request) {
    return res.status(404).json({ error: 'Payout request not found' });
  }

  if (request.status !== 'failed') {
    return res.status(400).json({ error: 'Only failed requests can be retried' });
  }

  request.status = 'pending';
  request.processedAt = undefined;
  request.failureReason = undefined;
  request.estimatedCompletion = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  
  res.json(request);
});

// Get payout methods for a doctor
router.get('/methods/:doctorId', (req, res) => {
  const { doctorId } = req.params;
  const methods = payoutMethods.filter(method => method.doctorId === doctorId);
  res.json(methods);
});

// Add a new payout method
router.post('/methods', (req, res) => {
  const { doctorId, type, provider, number, isDefault } = req.body;
  
  // Validate phone number based on provider
  const validatePhoneNumber = (number, provider) => {
    const cleanNumber = number.replace(/\s/g, '');
    switch (provider) {
      case 'MTN':
        return /^0(24|54|55|59)\d{7}$/.test(cleanNumber);
      case 'Airtel':
        return /^0(26|56|66)\d{7}$/.test(cleanNumber);
      case 'Vodafone':
        return /^0(20|50|57)\d{7}$/.test(cleanNumber);
      default:
        return false;
    }
  };

  if (!validatePhoneNumber(number, provider)) {
    return res.status(400).json({ error: 'Invalid phone number for provider' });
  }

  // If this is set as default, remove default from other methods
  if (isDefault) {
    payoutMethods.forEach(method => {
      if (method.doctorId === doctorId) {
        method.isDefault = false;
      }
    });
  }

  const newMethod = {
    id: String(payoutMethods.length + 1),
    doctorId,
    type,
    provider,
    number,
    isDefault: isDefault || false,
  };

  payoutMethods.push(newMethod);
  res.status(201).json(newMethod);
});

// Set default payout method
router.patch('/methods/:methodId/default', (req, res) => {
  const { methodId } = req.params;
  const { doctorId } = req.body;
  
  const method = payoutMethods.find(m => m.id === methodId && m.doctorId === doctorId);
  if (!method) {
    return res.status(404).json({ error: 'Payout method not found' });
  }

  // Remove default from other methods
  payoutMethods.forEach(m => {
    if (m.doctorId === doctorId) {
      m.isDefault = false;
    }
  });

  method.isDefault = true;
  res.json(method);
});

// Delete payout method
router.delete('/methods/:methodId', (req, res) => {
  const { methodId } = req.params;
  const methodIndex = payoutMethods.findIndex(m => m.id === methodId);
  
  if (methodIndex === -1) {
    return res.status(404).json({ error: 'Payout method not found' });
  }

  payoutMethods.splice(methodIndex, 1);
  res.status(204).send();
});

// Webhook endpoint for mobile money provider status updates
router.post('/webhook/status', (req, res) => {
  const { requestId, status, processedAt, completedAt, failureReason, estimatedCompletion } = req.body;
  
  const request = payoutRequests.find(req => req.id === requestId);
  if (!request) {
    return res.status(404).json({ error: 'Payout request not found' });
  }

  request.status = status;
  if (processedAt) request.processedAt = processedAt;
  if (completedAt) request.completedAt = completedAt;
  if (failureReason) request.failureReason = failureReason;
  if (estimatedCompletion) request.estimatedCompletion = estimatedCompletion;

  res.json(request);
});

// Get payout statistics
router.get('/stats/:doctorId', (req, res) => {
  const { doctorId } = req.params;
  const requests = payoutRequests.filter(req => req.doctorId === doctorId);
  
  const stats = {
    totalRequested: requests.length,
    totalCompleted: requests.filter(req => req.status === 'completed').length,
    totalFailed: requests.filter(req => req.status === 'failed').length,
    pendingAmount: requests
      .filter(req => req.status === 'pending' || req.status === 'processing')
      .reduce((sum, req) => sum + req.amount, 0),
    completedAmount: requests
      .filter(req => req.status === 'completed')
      .reduce((sum, req) => sum + req.amount, 0),
  };

  res.json(stats);
});

// Simulate payout processing (for testing)
router.post('/simulate/process', (req, res) => {
  const { requestId, newStatus } = req.body;
  const request = payoutRequests.find(req => req.id === requestId);
  
  if (!request) {
    return res.status(404).json({ error: 'Payout request not found' });
  }

  request.status = newStatus;
  if (newStatus === 'processing') {
    request.processedAt = new Date().toISOString();
  } else if (newStatus === 'completed') {
    request.processedAt = request.processedAt || new Date().toISOString();
    request.completedAt = new Date().toISOString();
  } else if (newStatus === 'failed') {
    request.processedAt = request.processedAt || new Date().toISOString();
    request.failureReason = 'Simulated failure for testing';
  }

  res.json(request);
});

module.exports = router;
