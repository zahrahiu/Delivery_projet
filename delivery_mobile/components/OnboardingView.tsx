import React, { useRef } from 'react';
import { StyleSheet, Text, View, Image, SafeAreaView, Dimensions, Animated, PanResponder } from 'react-native';

const { width } = Dimensions.get('window');

export const OnboardingView = ({ onNext }: { onNext: () => void }) => {
    const CONTAINER_WIDTH = width - 60;
    const BUTTON_WIDTH = 150;
    const MAX_TRANSLATE = CONTAINER_WIDTH - BUTTON_WIDTH - 12;
    const pan = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (e, gestureState) => {
                if (gestureState.dx >= 0 && gestureState.dx <= MAX_TRANSLATE) {
                    pan.setValue({ x: gestureState.dx, y: 0 });
                }
            },
            onPanResponderRelease: (e, gestureState) => {
                if (gestureState.dx > MAX_TRANSLATE / 1.5) {
                    Animated.spring(pan, {
                        toValue: { x: MAX_TRANSLATE, y: 0 },
                        useNativeDriver: false,
                    }).start(() => {
                        onNext(); // هادي اللي غتفتح الـ Login
                    });
                } else {
                    Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
                }
            },
        })
    ).current;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.logoContainer}>
                <Image source={require('@/assets/images/QribLikLOGO_White.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <View style={styles.imageContainer}>
                <Image source={require('@/assets/images/motor.png')} style={styles.mainImage} resizeMode="contain" />
                <View style={styles.pagination}>
                    <View style={styles.dot} /><View style={[styles.dot, styles.activeDot]} /><View style={styles.dot} />
                </View>
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.description}>Faites partie de l'aventure Qrib Lik et boostez votre activité de livraison.</Text>
            </View>
            <View style={styles.footer}>
                <View style={styles.slideTrack}>
                    <Text style={styles.skipText}>Slide ➔</Text>
                    <Animated.View {...panResponder.panHandlers} style={[styles.swipeContainer, { transform: [{ translateX: pan.x }] }]}>
                        <View style={styles.buttonIn}><Text style={styles.buttonText}>Continue</Text></View>
                    </Animated.View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    logoContainer: { alignItems: 'center', height: 80, marginTop: 20 },
    logoImage: { width: 900, height: 200, marginTop: 20 },
    imageContainer: { flex: 2, justifyContent: 'center', alignItems: 'center' },
    mainImage: { width: width * 0.9, height: width * 0.8, marginTop: 40 },
    contentContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
    pagination: { flexDirection: 'row', marginBottom: 20 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0', marginHorizontal: 5 },
    activeDot: { width: 22, backgroundColor: '#5D6B6B' },
    description: { fontSize: 16, textAlign: 'center', color: '#7F8C8D', marginTop: 10, lineHeight: 24 },
    footer: { paddingHorizontal: 30, paddingBottom: 40 },
    slideTrack: { backgroundColor: '#F5F5F5', height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, position: 'relative' },
    swipeContainer: { position: 'absolute', left: 6 },
    buttonIn: { backgroundColor: '#3b4e61', height: 50, width: 150, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold' },
    skipText: { position: 'absolute', right: 30, color: '#203339', fontWeight: '600', opacity: 0.3 },
});