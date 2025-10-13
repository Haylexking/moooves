import React from 'react'
export const motion = {
  div: (props: any) => React.createElement('div', props, props.children),
}
export const AnimatePresence = (props: any) => React.createElement(React.Fragment, null, props.children)

export default { motion, AnimatePresence }
