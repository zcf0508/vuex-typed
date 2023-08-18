export default {
  /** @param {typeof rootState} state */
  username: state => state.user.name,
  /** @param {typeof rootState} state */
  userage: state => state.user.age,
}
