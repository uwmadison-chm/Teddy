import {StyleSheet} from 'react-native'
import {borderRadius} from '../outline/styles'

export default StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '200%',
        paddingLeft: '50%',
    },

    text: {
        textAlign: 'left',
        includeFontPadding: false,
        textAlignVertical: 'top',
        left: borderRadius - 4,
    },
})
