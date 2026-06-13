import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all analyses for a facility
router.get('/', async (req, res) => {
  try {
    const facilityId = req.query.facilityId as string;
    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId is required' });
    }

    const analyses = await prisma.hazmatEyewashRiskAnalysis.findMany({
      where: { facilityId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(analyses);
  } catch (error) {
    console.error('Error fetching eyewash risk analyses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update an analysis
router.post('/', async (req, res) => {
  try {
    const { id, facilityId, analysisDate, improvementTargetDate, ...data } = req.body;
    
    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId is required' });
    }

    const parsedData = {
      ...data,
      facilityId,
      analysisDate: analysisDate ? new Date(analysisDate) : new Date(),
      improvementTargetDate: improvementTargetDate ? new Date(improvementTargetDate) : null,
      areaSquareMeters: parseFloat(data.areaSquareMeters || '0'),
      maxPersonnel: parseInt(data.maxPersonnel || '0'),
      chemicalTotalLiters: parseFloat(data.chemicalTotalLiters || '0'),
      chemExposureCount: parseInt(data.chemExposureCount || '0'),
      chemNearMissCount: parseInt(data.chemNearMissCount || '0'),
      bioExposureCount: parseInt(data.bioExposureCount || '0'),
      bioNearMissCount: parseInt(data.bioNearMissCount || '0'),
      chemProbability: parseFloat(data.chemProbability || '0'),
      chemFrequency: parseFloat(data.chemFrequency || '0'),
      chemSeverity: parseFloat(data.chemSeverity || '0'),
      chemScore: parseFloat(data.chemScore || '0'),
      bioProbability: parseFloat(data.bioProbability || '0'),
      bioFrequency: parseFloat(data.bioFrequency || '0'),
      bioSeverity: parseFloat(data.bioSeverity || '0'),
      bioScore: parseFloat(data.bioScore || '0')
    };

    let analysis;
    if (id) {
      analysis = await prisma.hazmatEyewashRiskAnalysis.update({
        where: { id },
        data: parsedData,
      });
    } else {
      analysis = await prisma.hazmatEyewashRiskAnalysis.create({
        data: parsedData,
      });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error saving eyewash risk analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an analysis
router.delete('/:id', async (req, res) => {
  try {
    await prisma.hazmatEyewashRiskAnalysis.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting eyewash risk analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
