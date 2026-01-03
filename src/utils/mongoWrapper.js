export function wrapCollection(collection) {
  return new Proxy(collection, {
    get(target, prop) {
      if (prop === 'insertOne') {
        return async (doc, options) => {
          const now = new Date();
          doc.createdAt = now;
          doc.modifiedAt = now;
          return target.insertOne(doc, options);
        };
      }
      if (prop === 'insertMany') {
        return async (docs, options) => {
          const now = new Date();
          docs.forEach(doc => {
            doc.createdAt = now;
            doc.modifiedAt = now;
          });
          return target.insertMany(docs, options);
        };
      }
      if (prop === 'updateOne') {
        return async (filter, update, options) => {
          const now = new Date();
          if (!update.$set) update.$set = {};
          update.$set.modifiedAt = now;
          return target.updateOne(filter, update, options);
        };
      }
      if (prop === 'updateMany') {
        return async (filter, update, options) => {
          const now = new Date();
          if (!update.$set) update.$set = {};
          update.$set.modifiedAt = now;
          return target.updateMany(filter, update, options);
        };
      }
      if (prop === 'findOneAndUpdate') {
        return async (filter, update, options) => {
          const now = new Date();
          if (!update.$set) update.$set = {};
          update.$set.modifiedAt = now;
          
          if (options && options.upsert) {
            if (!update.$setOnInsert) update.$setOnInsert = {};
            update.$setOnInsert.createdAt = now;
          }
          return target.findOneAndUpdate(filter, update, options);
        };
      }
      if (prop === 'bulkWrite') {
        return async (operations, options) => {
          const now = new Date();
          operations.forEach(op => {
            if (op.insertOne) {
              op.insertOne.document.createdAt = now;
              op.insertOne.document.modifiedAt = now;
            }
            if (op.updateOne) {
              if (!op.updateOne.update.$set) op.updateOne.update.$set = {};
              op.updateOne.update.$set.modifiedAt = now;
            }
            if (op.updateMany) {
              if (!op.updateMany.update.$set) op.updateMany.update.$set = {};
              op.updateMany.update.$set.modifiedAt = now;
            }
            // Add other operations if needed (e.g. replaceOne)
          });
          return target.bulkWrite(operations, options);
        };
      }
      
      return target[prop];
    }
  });
}
