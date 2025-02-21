const admin = require("./firebaseAdmin");

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
                return { success: false, message: "No such document!" }; // TODO: This is where we create a new one just in case
            }
        })
        .catch((error) => {
            return { success: false, message: error }; // TODO: More robust error handling
        });
};

module.exports.queryMultiple = async function queryMultiple(ids, collectionName) {
    return await db.collection(collectionName).where("uid", "in", ids)
        .get()
        .then((docSnapshot) => {
            if (!docSnapshot.empty) {
                const docs = docSnapshot.docs.map(x => x.data());
                return { success: true, data: docs };
            } else {
                return { success: false, message: "No such documents!" };
            }
        })
        .catch((error) => {
            return { success: false, message: error }; // TODO: More robust error handling
        });
}

module.exports.updateFieldArray = async function updateFieldArray(collection, doc, fieldName, newValue) {
    const docRef = db.collection(collection).doc(doc);
    let update = {};
    update[fieldName] = admin.firestore.FieldValue.arrayUnion(newValue);
    return await docRef.update(update);
}