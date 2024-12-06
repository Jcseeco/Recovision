export function debounce(cb, delay = 300) {
    let timeout

    return function (...args) {
        if (timeout) clearTimeout(timeout)

        timeout = setTimeout(() => {
            cb.apply(this, args)
        }, delay)
    }
}