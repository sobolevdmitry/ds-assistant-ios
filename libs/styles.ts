import {
    StyleSheet
} from 'react-native';

import Colors from './colors';

export default StyleSheet.create({
    backgroundStyle: {
        backgroundColor: Colors.white,
    },
    titleContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
        color: Colors.black
    },
    titleText: {
        fontSize: 24,
        fontWeight: '600'
    },
    inputContainer: {
        marginTop: 16,
        paddingHorizontal: 24
    },
    textInput: {
        height: 48,
        marginVertical: 8,
        padding: 16,
        backgroundColor: Colors.lighter,
    },
})
