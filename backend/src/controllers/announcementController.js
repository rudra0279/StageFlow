import { Announcement } from '../models/Announcement.js';

export const getAnnouncements = async (req, res, next) => {
  try {
    const { eventId } = req.query;
    const filter = {
      ...(eventId ? { eventId } : {}),
      isDismissed: false
    };

    const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Announcement posted successfully',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

export const dismissAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { isDismissed: true },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Announcement dismissed'
    });
  } catch (error) {
    next(error);
  }
};
