/**
 * Wraps a promise in a timeout.
 * Rejects with 'TIMEOUT' if the promise doesn't resolve within ms.
 */
export const withTimeout = <T>(promise: Promise<T>, ms: number = 10000): Promise<T> => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('TIMEOUT'));
        }, ms);

        promise
            .then((res) => {
                clearTimeout(timer);
                resolve(res);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
};
