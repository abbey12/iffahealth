const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const router = express.Router();

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERT_PRIMARY;
const TOKEN_EXPIRY_SECONDS = parseInt(process.env.AGORA_TOKEN_EXPIRY_SECONDS || '1800', 10);

if (!APP_ID || !APP_CERTIFICATE) {
  console.warn('[Agora] APP_ID or CERTIFICATE missing. Video call token generation will fail until they are provided.');
}

const generateUid = () => crypto.randomInt(100000, 999999);

const buildTokenResponse = ({ channelName, role, uid }) => {
  if (!APP_ID || !APP_CERTIFICATE) {
    throw new Error('Agora credentials are not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = now + TOKEN_EXPIRY_SECONDS;

  const agoraRole = role === 'doctor' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    agoraRole,
    privilegeExpiredTs
  );

  return {
    token,
    uid,
    role,
    agoraRole: agoraRole === RtcRole.PUBLISHER ? 'publisher' : 'audience',
    agoraAppId: APP_ID,
    expiresAt: new Date(privilegeExpiredTs * 1000).toISOString(),
    expiresIn: TOKEN_EXPIRY_SECONDS,
  };
};

router.post(
  '/session',
  [
    body('appointmentId').optional().isString().trim(),
    body('channelName').optional().isString().trim(),
    body('doctorId').optional().isString().trim(),
    body('patientId').optional().isString().trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload',
        errors: errors.array(),
      });
    }

    const { appointmentId, channelName, doctorId, patientId } = req.body;

    if (!channelName && !appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Either channelName or appointmentId is required',
      });
    }

    const resolvedChannelName = channelName || `appointment_${appointmentId}`;

    try {
      const doctorToken = buildTokenResponse({
        channelName: resolvedChannelName,
        role: 'doctor',
        uid: generateUid(),
      });

      const patientToken = buildTokenResponse({
        channelName: resolvedChannelName,
        role: 'patient',
        uid: generateUid(),
      });

      return res.status(200).json({
        success: true,
        data: {
          channelName: resolvedChannelName,
          appointmentId: appointmentId || null,
          doctorId: doctorId || null,
          patientId: patientId || null,
          expiresAt: doctorToken.expiresAt,
          tokens: {
            doctor: doctorToken,
            patient: patientToken,
          },
        },
      });
    } catch (error) {
      console.error('[Agora] Failed to create session:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create video call session',
        error: error.message,
      });
    }
  }
);

router.post(
  '/token',
  [
    body('channelName').optional().isString().trim(),
    body('appointmentId').optional().isString().trim(),
    body('role').isIn(['doctor', 'patient']).withMessage('role must be doctor or patient'),
    body('uid').optional().isInt({ min: 1, max: 4294967295 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload',
        errors: errors.array(),
      });
    }

    const { channelName, appointmentId, role, uid } = req.body;

    if (!channelName && !appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Either channelName or appointmentId is required',
      });
    }

    const resolvedChannelName = channelName || `appointment_${appointmentId}`;

    try {
      const tokenResponse = buildTokenResponse({
        channelName: resolvedChannelName,
        role,
        uid: uid ? Number(uid) : generateUid(),
      });

      return res.status(200).json({
        success: true,
        data: {
          channelName: resolvedChannelName,
          role,
          token: tokenResponse,
        },
      });
    } catch (error) {
      console.error('[Agora] Failed to generate token:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate video call token',
        error: error.message,
      });
    }
  }
);

module.exports = router;

