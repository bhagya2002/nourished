const admin = require("./firebaseAdmin");
const logger = require("../util/logger");

const db = admin.firestore();

module.exports.queryDatabaseSingle = async function queryDatabaseSingle(
    docName,
    collectionName
) {
    const docRef = db.collection(collectionName).doc(docName);
    return await docRef
        .get()
        .then((docSnapshot) => {
            if (docSnapshot.exists) {
                return { success: true, data: docSnapshot.data() };
            } else {
                const message = `Failed to find document with uid:${docName} in ${collectionName} collection`;
                logger.error(`Failed to find document with uid:${docName} in ${collectionName} collection`);
                return { success: false, message: message };
            }
        })
        .catch((error) => {
            logger.error(error);
            return { success: false, message: error }; // TODO: More robust error handling
        });
};

module.exports.queryMultiple = async function queryMultiple(ids, collectionName) {
    if (!ids || ids.length === 0) {
        return { success: true, data: [] };
    }

    return await db.collection(collectionName).where("__name__", "in", ids)
        .get()
        .then((docSnapshot) => {
            if (!docSnapshot.empty) {
                const docs = docSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return { success: true, data: docs };
            } else {
                return { success: false, message: "No such documents!" };
            }
        })
        .catch((error) => {
            logger.error(error);
            return { success: false, message: error }; // TODO: More robust error handling
        });
}

module.exports.addSingleDoc = async function addSingleDoc(collectionName, object) {
    let newDocRef = db.collection(collectionName).doc();
    return await newDocRef.set(object)
        .then(() => {
            return { success: true, id: newDocRef.id };
        })
        .catch((error) => {
            logger.error(error);
            return { success: false, error: error };
        });
}

module.exports.deleteSingleDoc = async function deleteSingleDoc(collectionName, uid) {
    return await db.collection(collectionName).doc(uid).delete()
        .then(() => {
            return { success: true };
        })
        .catch((error) => {
            logger.error(error);
            return { success: false, error: error };
        });
}

module.exports.updateField = async function updateField(collection, doc, fieldName, newValue) {
    const docRef = db.collection(collection).doc(doc);
    let update = {};
    update[fieldName] = newValue;
    return await docRef.update(update).then(() => {
        return { success: true };
    }).catch((error) => {
        logger.error(error);
        return { success: false, error: error };
    });
}

module.exports.updateFieldArray = async function updateFieldArray(collection, doc, fieldName, newValue) {
    const docRef = db.collection(collection).doc(doc);
    let update = {};
    update[fieldName] = admin.firestore.FieldValue.arrayUnion(newValue);
    return await docRef.update(update).then(() => {
        return { success: true };
    }).catch((error) => {
        logger.error(error);
        return { success: false, error: error };
    });
}

module.exports.removeFromFieldArray = async function removeFromFieldArray(collection, doc, fieldName, valueToRemove) {
    const docRef = db.collection(collection).doc(doc);
    let update = {};
    update[fieldName] = admin.firestore.FieldValue.arrayRemove(valueToRemove);
    return await docRef.update(update).then(() => {
        return { success: true };
    }).catch((error) => {
        logger.error(error);
        return { success: false, error: error };
    });
}