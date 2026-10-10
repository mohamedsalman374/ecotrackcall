'use strict';

function getHealth(req, res) {
  res.json({
    success: true,
    status: 'ok',
    app: 'EcoTrack REST API',
    version: '2.0.0',
    node: process.version,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };
