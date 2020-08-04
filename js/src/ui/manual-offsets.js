var Promise = require('promise');

/**
 * create input for manually setting the start of the internal
 * pointer list and the start of the external pointer list
 * @returns {[HTMLFormElement, Promise<Object>]}
 */
function createManualInput() {
    const form = document.createElement('form')
    const in_name = 'manualInternalOffset'
    const internal = makeInput(in_name, 'hex or decimal')
    const in_label = makeLabel(in_name, 'Internal Pointer List Start:')
    //const ex_name = 'manualExternalOffset'
    //const external = makeInput(ex_name, 'hex offset')
    //const ex_label = makeLabel(ex_name, 'External Pointer List Start:')
    
    const button = document.createElement('button');
    button.textContent = "Parse File"

    let elems = [in_label, internal, button]

    elems.forEach(el => form.appendChild(el))

    return [form, promiseOffsetInfo(form, in_name)]
}

/**
 * @param {string} name htmlFor
 * @param {string} text 
 * @returns {HTMLLabelElement}
 */
function makeLabel(name, text) {
    const el = document.createElement('label')
    el.innerText = text
    el.htmlFor = name

    return el
}

/**
 * @param {string} name 
 * @param {string} placeholder 
 * @returns {HTMLInputElement}
 */
function makeInput(name, placeholder) {
    const el = document.createElement("input")
    el.placeholder = placeholder
    el.id = name
    el.name = name

    return el
}

/**
 * @param {HTMLFormElement} form
 * @param {string} internal
 * @returns {Promise<Object>}
 */
function promiseOffsetInfo(form, internal) {
    return new Promise((resolve, reject) => {
        form.addEventListener('submit', e => {
            e.preventDefault()
            try {
                const in_text = document
                    .getElementById(internal)
                    .value

                if (!in_text) {
                    // todo: error type
                    reject("No Internal Pointer Offset")
                }

                console.log("running promise for pointer offset: " + in_text)
                resolve({nodeOffset: parseInt(in_text)})
            } catch (e) {
                reject(e)
            }
        })
    })
}

module.exports = createManualInput
