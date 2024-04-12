module.exports = {
  generatePassword: () => {
    const lowerLetters = 'abcdefghijklmnopqrstuvwxyz'
    const upperLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let password = ''

    password += upperLetters[Math.floor(Math.random() * upperLetters.length)]
    password += lowerLetters[Math.floor(Math.random() * upperLetters.length)]
    password += Math.random().toString(36).slice(-8) + 1

    return password
  },
  generateID: () => {
    const upperLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let nationalId = ''
    const genderList = [1, 2]
    const numbers = '123456789'

    nationalId += upperLetters[Math.floor(Math.random() * upperLetters.length)]
    nationalId += genderList[Math.floor(Math.random() * genderList.length)]

    for (let i = 0; i < 8; i++) {
      nationalId += numbers[Math.floor(Math.random() * numbers.length)]
    }

    return nationalId
  }
}
