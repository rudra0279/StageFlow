// src/models/inMemoryStore.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function newObjectId() {
  return crypto.randomBytes(12).toString('hex');
}

const DEFAULT_INVITE_CODES = [
  {
    _id: 'code-org-7f29x',
    code: 'ORG-7F29X',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Event Lead',
    responsibility: 'Operations + Coordination',
    status: 'ACTIVE',
    usageCount: 0,
    maxUses: 100
  },
  {
    _id: 'code-tech-4b82y',
    code: 'TECH-4B82Y',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Technical Lead',
    responsibility: 'AV + Stage Technology',
    status: 'ACTIVE',
    usageCount: 0,
    maxUses: 100
  },
  {
    _id: 'code-stage-91c2m',
    code: 'STAGE-91C2M',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Stage Manager',
    responsibility: 'Presentation systems & Timing',
    status: 'ACTIVE',
    usageCount: 0,
    maxUses: 100
  },
  {
    _id: 'code-log-33a8k',
    code: 'LOG-33A8K',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Logistics Lead',
    responsibility: 'Venue Operations & Hospitality',
    status: 'ACTIVE',
    usageCount: 0,
    maxUses: 100
  },
  {
    _id: 'code-anc-55d1p',
    code: 'ANC-55D1P',
    registrationType: 'ANCHOR',
    role: 'anchor',
    roleTitle: 'Stage Anchor / MC',
    responsibility: 'Stage MC & Teleprompter Execution',
    status: 'ACTIVE',
    usageCount: 0,
    maxUses: 100
  },
  {
    _id: 'code-expired-99',
    code: 'EXPIRED-99',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Event Lead',
    responsibility: 'Operations',
    status: 'EXPIRED',
    usageCount: 0,
    maxUses: 100
  },
  {
    _id: 'code-disabled-88',
    code: 'DISABLED-88',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Technical Lead',
    responsibility: 'AV Setup',
    status: 'DISABLED',
    usageCount: 0,
    maxUses: 100
  },
  {
    _id: 'code-exhausted-77',
    code: 'EXHAUSTED-77',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Volunteer',
    responsibility: 'Audience Control',
    status: 'EXHAUSTED',
    usageCount: 10,
    maxUses: 10
  }
];

const collections = {
  User: [],
  Event: [],
  Speaker: [],
  Agenda: [],
  Announcement: [],
  Question: [],
<<<<<<< Updated upstream
  InviteCode: [],
=======
  InviteCode: DEFAULT_INVITE_CODES.map(c => ({ ...c })),
>>>>>>> Stashed changes
  Task: [],
  ChatMessage: [],
};

function matchesFilter(item, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;

  if (filter.$or && Array.isArray(filter.$or)) {
    const matchedOr = filter.$or.some(subFilter => matchesFilter(item, subFilter));
    if (!matchedOr) return false;
  }

  for (const [key, val] of Object.entries(filter)) {
    if (key === '$or') continue;
    const itemVal = item[key];
    const itemValStr = itemVal !== undefined && itemVal !== null ? itemVal.toString() : '';

    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if ('$ne' in val) {
        const neStr = val.$ne !== null ? val.$ne.toString() : '';
        if (itemValStr === neStr) return false;
      }
      if ('$gt' in val) {
        if (!(itemVal > val.$gt)) return false;
      }
      if ('$in' in val) {
        const strList = val.$in.map(v => (v !== null && v !== undefined ? v.toString() : ''));
        if (!strList.includes(itemValStr)) return false;
      }
    } else if (val instanceof Date) {
      if (new Date(itemVal).getTime() !== val.getTime()) return false;
    } else if (val !== undefined && val !== null) {
      if (itemValStr !== val.toString()) return false;
    }
  }
  return true;
}

function cloneDoc(doc) {
  if (!doc) return null;
  const clone = { ...doc };
  return clone;
}

function createDocInstance(modelName, data) {
  const instance = { ...data };
  if (!instance._id) instance._id = newObjectId();
  if (!instance.createdAt) instance.createdAt = new Date().toISOString();
  if (!instance.updatedAt) instance.updatedAt = new Date().toISOString();

  instance.save = async function () {
    instance.updatedAt = new Date().toISOString();
    const list = collections[modelName];
    const idx = list.findIndex(d => d._id.toString() === instance._id.toString());
    if (idx >= 0) {
      list[idx] = { ...instance };
    } else {
      list.push({ ...instance });
    }
    return instance;
  };

  instance.toJSON = function () {
    const copy = { ...instance };
    if (modelName === 'User') {
      delete copy.password;
    }
    delete copy.save;
    delete copy.toJSON;
    delete copy.comparePassword;
    return copy;
  };

  if (modelName === 'User') {
    instance.comparePassword = async function (candidatePassword) {
      return bcrypt.compare(candidatePassword, instance.password);
    };
  }

  if (modelName === 'Question') {
    instance.isAnswered = instance.status === 'ANSWERED';
    if (!instance.track && instance.trackId) instance.track = instance.trackId;
    if (!instance.trackId && instance.track) instance.trackId = instance.track;
  }

  if (modelName === 'Event') {
    if (!instance.workTypes) {
      try {
        const { getDefaultWorkTypes } = require('../constants/workTypes');
        instance.workTypes = getDefaultWorkTypes();
      } catch (e) {
        instance.workTypes = [];
      }
    }
    if (!instance.committee) {
      instance.committee = [];
    }
  }

  if (modelName === 'InviteCode') {
    if (instance.currentUses === undefined) instance.currentUses = 0;
    if (instance.maxUses === undefined) instance.maxUses = 1;
    if (instance.isActive === undefined) instance.isActive = true;
  }

  if (modelName === 'Task') {
    if (!instance.status) instance.status = 'TODO';
    if (!instance.priority) instance.priority = 'MEDIUM';
  }

  if (modelName === 'ChatMessage') {
    if (instance.isEdited === undefined) instance.isEdited = false;
    if (instance.isDeleted === undefined) instance.isDeleted = false;
    if (!instance.timestamp) instance.timestamp = new Date().toISOString();
  }

  return instance;
}

class MemoryQuery {
  constructor(modelName, executor) {
    this.modelName = modelName;
    this.executor = executor;
    this.populates = [];
    this.sortFields = null;
    this.selectedFields = null;
  }

  populate(field, select) {
    this.populates.push({ field, select });
    return this;
  }

  sort(sortObj) {
    this.sortFields = sortObj;
    return this;
  }

  select(selectFields) {
    this.selectedFields = selectFields;
    return this;
  }

  limit(limitNum) {
    this.limitNum = limitNum;
    return this;
  }

  skip(skipNum) {
    this.skipNum = skipNum;
    return this;
  }

  async exec() {
    let result = await this.executor();
    if (Array.isArray(result)) {
      if (this.sortFields) {
        result.sort((a, b) => {
          for (const [key, direction] of Object.entries(this.sortFields)) {
            const valA = a[key];
            const valB = b[key];
            if (valA < valB) return direction === 1 ? -1 : 1;
            if (valA > valB) return direction === 1 ? 1 : -1;
          }
          return 0;
        });
      }

      if (this.skipNum) {
        result = result.slice(this.skipNum);
      }
      if (this.limitNum !== undefined && this.limitNum !== null) {
        result = result.slice(0, this.limitNum);
      }

      for (const p of this.populates) {
        for (let i = 0; i < result.length; i++) {
          result[i] = populateField(result[i], p.field);
        }
      }
      return result.map(d => createDocInstance(this.modelName, d));
    } else if (result) {
      for (const p of this.populates) {
        result = populateField(result, p.field);
      }
      if (this.selectedFields && this.selectedFields.includes('-password')) {
        delete result.password;
      }
      return createDocInstance(this.modelName, result);
    }
    return null;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

function populateField(doc, field) {
  if (!doc) return doc;
  const targetId = doc[field];
  if (!targetId || typeof targetId === 'object') return doc;

  // Search in other collections
  for (const [mName, list] of Object.entries(collections)) {
    const found = list.find(d => d._id.toString() === targetId.toString());
    if (found) {
      const copy = { ...found };
      if (mName === 'User') delete copy.password;
      doc[field] = copy;
      break;
    }
  }
  return doc;
}

function createMemoryModel(modelName) {
  return {
    async create(data) {
      const doc = createDocInstance(modelName, data);
      if (modelName === 'User' && doc.password) {
        const salt = await bcrypt.genSalt(10);
        doc.password = await bcrypt.hash(doc.password, salt);
      }
      collections[modelName].push({ ...doc });
      return doc;
    },

    find(filter = {}) {
      return new MemoryQuery(modelName, async () => {
        const matches = collections[modelName].filter(item => matchesFilter(item, filter));
        return matches.map(cloneDoc);
      });
    },

    findById(id) {
      return new MemoryQuery(modelName, async () => {
        if (!id) return null;
        const found = collections[modelName].find(item => item._id.toString() === id.toString());
        return found ? cloneDoc(found) : null;
      });
    },

    findOne(filter = {}) {
      return new MemoryQuery(modelName, async () => {
        const found = collections[modelName].find(item => matchesFilter(item, filter));
        return found ? cloneDoc(found) : null;
      });
    },

    async findByIdAndUpdate(id, update, options = {}) {
      const list = collections[modelName];
      const idx = list.findIndex(item => item._id.toString() === id.toString());
      if (idx === -1) return null;

      let item = list[idx];
      let updatedData = { ...item };

      if (update.$inc) {
        for (const k in update.$inc) {
          updatedData[k] = (updatedData[k] || 0) + update.$inc[k];
        }
      }
      if (update.$addToSet) {
        for (const k in update.$addToSet) {
          if (!Array.isArray(updatedData[k])) updatedData[k] = [];
          if (!updatedData[k].includes(update.$addToSet[k])) {
            updatedData[k].push(update.$addToSet[k]);
          }
        }
      }
      if (update.$set) {
        Object.assign(updatedData, update.$set);
      }
      for (const k in update) {
        if (!k.startsWith('$')) {
          updatedData[k] = update[k];
        }
      }

      updatedData.updatedAt = new Date().toISOString();
      list[idx] = updatedData;
      return createDocInstance(modelName, cloneDoc(list[idx]));
    },

    async findByIdAndDelete(id) {
      const list = collections[modelName];
      const idx = list.findIndex(item => item._id.toString() === id.toString());
      if (idx === -1) return null;
      const [deleted] = list.splice(idx, 1);
      return createDocInstance(modelName, deleted);
    },

    async countDocuments(filter = {}) {
      return collections[modelName].filter(item => matchesFilter(item, filter)).length;
    },

    async updateMany(filter, update) {
      let count = 0;
      const setFields = update.$set || update;
      for (const item of collections[modelName]) {
        if (matchesFilter(item, filter)) {
          Object.assign(item, setFields, { updatedAt: new Date().toISOString() });
          count++;
        }
      }
      return { modifiedCount: count };
    },

    clearCollection() {
      collections[modelName] = [];
    }
  };
}

const MemoryUser = createMemoryModel('User');
const MemoryEvent = createMemoryModel('Event');
const MemorySpeaker = createMemoryModel('Speaker');
const MemoryAgenda = createMemoryModel('Agenda');
const MemoryAnnouncement = createMemoryModel('Announcement');
const MemoryQuestion = createMemoryModel('Question');
const MemoryInviteCode = createMemoryModel('InviteCode');
const MemoryTask = createMemoryModel('Task');
const MemoryChatMessage = createMemoryModel('ChatMessage');

function clearAllMemoryCollections() {
  for (const key in collections) {
    collections[key] = [];
  }
  collections.InviteCode = DEFAULT_INVITE_CODES.map(c => ({ ...c }));
}

module.exports = {
  MemoryUser,
  MemoryEvent,
  MemorySpeaker,
  MemoryAgenda,
  MemoryAnnouncement,
  MemoryQuestion,
  MemoryInviteCode,
  MemoryTask,
  MemoryChatMessage,
<<<<<<< Updated upstream
=======
  DEFAULT_INVITE_CODES,
>>>>>>> Stashed changes
  clearAllMemoryCollections,
  collections,
};
