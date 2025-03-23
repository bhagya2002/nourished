const admin = require("./firebaseAdmin");
const logger = require("../util/logger");

const db = admin.firestore();

module.exports.queryDatabaseSingle = async function queryDatabaseSingle(
  docName,
  collectionName,
) {
  const docRef = db.collection(collectionName).doc(docName);
  return await docRef
    .get()
    .then((docSnapshot) => {
      if (docSnapshot.exists) {
        return {
          success: true,
          data: { id: docSnapshot.id, ...docSnapshot.data() },
        };
      } else {
        const message = `Failed to find document with uid:${docName} in ${collectionName} collection`;
        logger.error(
          `Failed to find document with uid:${docName} in ${collectionName} collection`,
        );
        return { success: false, message: message };
      }
    })
    .catch((error) => {
      logger.error(error);
      return { success: false, message: error }; // TODO: More robust error handling
    });
};

module.exports.queryMultiple = async function queryMultiple(
  ids,
  collectionName,
) {
  if (!ids || ids.length === 0) {
    return { success: true, data: [] };
  }

  return await db
    .collection(collectionName)
    .where("__name__", "in", ids)
    .get()
    .then((docSnapshot) => {
      if (!docSnapshot.empty) {
        const docs = docSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        return { success: true, data: docs };
      } else {
        return { success: false, message: "No such documents!" };
      }
    })
    .catch((error) => {
      logger.error(error);
      return { success: false, message: error }; // TODO: More robust error handling
    });
};

module.exports.addSingleDoc = async function addSingleDoc(
  collectionName,
  object,
) {
  let newDocRef = db.collection(collectionName).doc();
  return await newDocRef
    .set(object)
    .then(() => {
      return { success: true, id: newDocRef.id };
    })
    .catch((error) => {
      logger.error(error);
      return { success: false, error: error };
    });
};

module.exports.deleteSingleDoc = async function deleteSingleDoc(
  collectionName,
  uid,
) {
  return await db
    .collection(collectionName)
    .doc(uid)
    .delete()
    .then(() => {
      return { success: true };
    })
    .catch((error) => {
      logger.error(error);
      return { success: false, error: error };
    });
};

module.exports.updateField = async function updateField(
  collection,
  doc,
  fieldName,
  newValue,
) {
  const docRef = db.collection(collection).doc(doc);
  let update = {};
  update[fieldName] = newValue;
  return await docRef
    .update(update)
    .then(() => {
      return { success: true };
    })
    .catch((error) => {
      logger.error(error);
      return { success: false, error: error };
    });
};

module.exports.incrementField = async function incrementField(
  collection,
  doc,
  fieldName,
  amount,
) {
  const docRef = db.collection(collection).doc(doc);
  let update = {};
  update[fieldName] = admin.firestore.FieldValue.increment(amount);
  return await docRef
    .update(update)
    .then(() => {
      return { success: true };
    })
    .catch((error) => {
      logger.error(error);
      return { success: false, error: error };
    });
};

module.exports.updateFieldArray = async function updateFieldArray(
  collection,
  doc,
  fieldName,
  newValue,
) {
  const docRef = db.collection(collection).doc(doc);
  let update = {};
  update[fieldName] = admin.firestore.FieldValue.arrayUnion(newValue);
  return await docRef
    .update(update)
    .then(() => {
      return { success: true };
    })
    .catch((error) => {
      logger.error(error);
      return { success: false, error: error };
    });
};

module.exports.removeFromFieldArray = async function removeFromFieldArray(
  collection,
  doc,
  fieldName,
  valueToRemove,
) {
  const docRef = db.collection(collection).doc(doc);
  let update = {};
  update[fieldName] = admin.firestore.FieldValue.arrayRemove(valueToRemove);
  return await docRef
    .update(update)
    .then(() => {
      return { success: true };
    })
    .catch((error) => {
      logger.error(error);
      return { success: false, error: error };
    });
};

/**
 * Update a document with new data
 * @param {string} collectionName - The collection name
 * @param {string} docId - The document ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} - Result object
 */
module.exports.updateSingleDoc = async function updateSingleDoc(
  collectionName,
  docId,
  updateData
) {
  const docRef = db.collection(collectionName).doc(docId);
  return await docRef
    .update(updateData)
    .then(() => {
      return { success: true };
    })
    .catch((error) => {
      logger.error(error);
      return { success: false, error: error };
    });
};

// Add queryDatabase function to query where a field equals a value
module.exports.queryDatabase = async function queryDatabase(
  fieldValue,
  collectionName,
  fieldName,
) {
  try {
    const collectionRef = db.collection(collectionName);
    const query = collectionRef.where(fieldName, "==", fieldValue);

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
      return { success: true, data: [] };
    }

    // Convert the query results to an array of documents
    const docs = [];
    querySnapshot.forEach((doc) => {
      docs.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return { success: true, data: docs };
  } catch (error) {
    logger.error("Error in queryDatabase:", error);
    return {
      success: false,
      error: typeof error === "object" ? error.message : String(error),
    };
  }
};

module.exports.batch = function batch() {
  return db.batch();
};

module.exports.getRef = function getRef(collectionName, docName) {
  return db.collection(collectionName).doc(docName);
};

module.exports.commitBatch = async function commitBatch(batch) {
  return await batch
    .commit()
    .then(() => {
      return { success: true };
    })
    .catch((error) => {
      logger.error(error);
      return { success: false, error: error };
    });
};

module.exports.getDeleteFromArray = function getDeleteFromArray(valueToRemove) {
  return admin.firestore.FieldValue.arrayRemove(valueToRemove);
};

module.exports.getAddToArray = function getAddToArray(valueToAdd) {
  return admin.firestore.FieldValue.arrayUnion(valueToAdd);
};

/**
 * Query database with multiple custom conditions
 * @param {string} collectionName - Collection to query
 * @param {Array<Array<any>>} conditions - Array of condition arrays [fieldName, operator, value]
 * @returns {Promise<Object>} - Query result
 */
module.exports.queryDatabaseCustom = async function queryDatabaseCustom(
  collectionName,
  conditions,
) {
  try {
    let query = db.collection(collectionName);

    // Apply all conditions to the query
    for (const condition of conditions) {
      if (condition.length !== 3) {
        throw new Error(
          `Invalid condition format: ${JSON.stringify(condition)}`,
        );
      }

      const [field, operator, value] = condition;
      query = query.where(field, operator, value);
    }

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
      return { success: true, data: [] };
    }

    // Convert the query results to an array of documents
    const docs = [];
    querySnapshot.forEach((doc) => {
      docs.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return { success: true, data: docs };
  } catch (error) {
    logger.error("Error in queryDatabaseCustom:", error);
    return {
      success: false,
      error: typeof error === "object" ? error.message : String(error),
    };
  }
};
