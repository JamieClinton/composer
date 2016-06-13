import * as _ from "lodash";

export class ObjectHelper {

    private static pathDelimiter = ".";

    /**
     * Adds a value to a nested path in an object
     *
     * @param target Target object to add properties to
     * @param path dot-delimited path, ex. "foo.bar.baz"
     * @param value value to add to the "baz" key
     */
    public static addProperty(target: Object, path: string[] | string, value: any): void {

        // Ensure that path is an array of path elements
        const resolvedPath = typeof path === "string" ? path.split(ObjectHelper.pathDelimiter) : path;

        (<Array<string>> resolvedPath).reduce((acc, curr, index, arr)=> {
            if (index === arr.length - 1) {
                return acc[curr] = value;
            }

            if (!acc.hasOwnProperty(curr)) {
                acc[curr] = {};
                return acc[curr];
            } else if (typeof acc[curr] === "object" && acc[curr] !== null) {
                return acc[curr];
            } else {
                throw new Error("Couldn't add a nested property to type " + typeof acc);
            }
        }, target);
    }

    /**
     * Overwrite enumerable properties of the target with the ones from the source object
     * @param target
     * @param source
     * @returns {Object}
     * @link ObjectHelper-addEnumerablesTest
     */
    public static addEnumerables(target: Object, source: Object): void {
        for (let key of Object.keys(source)) {
            if (target.propertyIsEnumerable(key)) {
                target[key] = source[key];
            }
        }
    }

    /**
     * Iterate through all properties of the object and apply the function on each of them
     *
     * @param object
     * @param callback
     */
    public static iterateAll(object: Object, callback: (propertyName: string, propertyValue: any, object?: any) => void) {

        let walked = [];
        let stack = [{obj: object, stackPath: ''}];

        while(stack.length > 0)  {

            let lastStackItem = stack.pop();
            let lastStackItemObject = lastStackItem.obj;
            
            walked.push(lastStackItemObject);

            /* Will iterate over ALL enumerable properties of the object!
             * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in */
            for (let property in lastStackItemObject) {

                /* Make sure we don't loop on inherited properties */
                if (lastStackItemObject.hasOwnProperty(property)) {

                    if (typeof lastStackItemObject[property] === "object") {
                        let alreadyFound = false;

                        /* Check for circular reference */
                        for (let i = 0; i < walked.length; i++) {
                            if (_.isEqual(walked[i], lastStackItemObject[property])) {
                                alreadyFound = true;
                                break;
                            }
                        }

                        if (!alreadyFound) {
                            walked.push(lastStackItemObject[property]);
                            stack.push({obj: lastStackItemObject[property], stack: lastStackItem.stackPath + '.' + property});
                        }

                    } else {
                        callback(property, lastStackItemObject[property], lastStackItemObject);
                    }
                } /* if */
            } /* for */
        } /* while */
    }
}
