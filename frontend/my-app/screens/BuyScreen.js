/**
 * Buy Energy Screen
 *
 * Screen for buying energy from peers or the grid.
 *
 * @author Team GreyDevs
 */

import React, { useState , useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../assets/config';
import { SafeAreaView } from 'react-native';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import UniversalSafeArea from '../components/UniversalSafeArea';
import styles from '../styles/BuySellScreenStyles.js';



// Translations
const translations = {
  en: {
    buyEnergy: "Buy Energy",
    rate: "Rate:",
    availableUnits: "Available:",
    trustScore: "Trust Score:",
    buyNow: "Buy Now",
    solPerKwh: "SOL/kWh",
    confirmPurchase: "Confirm Purchase",
    purchaseSuccessful: "Purchase Successful",
    purchaseMessage: "You have successfully purchased energy.",
    oops: "Oops",
    noSellers: "No sellers currently available.",
    onMarket: "On Market:",
    languageToggle: "EN → BN"
  },
  bn: {
    buyEnergy: "শক্তি কিনুন",
    rate: "দর:",
    availableUnits: "উপলভ্য:",
    trustScore: "বিশ্বাস স্কোর:",
    buyNow: "এখন কিনুন",
    solPerKwh: "SOL/kWh",
    confirmPurchase: "ক্রয় নিশ্চিত করুন",
    purchaseSuccessful: "ক্রয় সফল হয়েছে",
    purchaseMessage: "আপনি সফলভাবে শক্তি কিনেছেন।",
    oops: "দুঃখিত",
    noSellers: "বর্তমানে কোন বিক্রেতা উপলব্ধ নেই।",
    onMarket: "বাজারে:",
    languageToggle: "BN → EN"
  },
};

export default function BuyEnergyScreen() {
  const [language, setLanguage] = useState("en");
  const [sellers, setSeller] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);


    useEffect(() => {
        fetchSellers();
    }, []);

    async function fetchSellers() {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${config.API_BASE_URL}/buy`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch sellers');
            }

            setSeller(data.data);
            setIsLoaded(data.success);
        } catch (err) {
            console.error("Error fetching sellers:", err);
            Alert.alert("Error", "Failed to fetch sellers. Check your network connection.");
        }
    }

    if (!isLoaded) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>Loading sellers...</Text>
            </SafeAreaView>
        );
    }


  const handleBuyEnergy = async (seller) => {
  Alert.alert(
    translations[language].confirmPurchase,
    `Are you sure you want to buy ${seller.availableUnits} from ${seller.name}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: translations[language].buyNow,
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${config.API_BASE_URL}/buy/buyNow`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sellerId: seller.id,
                amount: parseFloat(seller.onMarket.split(' ')[0]), // assuming onMarket is "7 kWh"
                rate: parseFloat(seller.rate.split(' ')[0]),       // assuming rate is "0.24 SOL/kWh"
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Failed to buy energy');
            }

            Alert.alert(translations[language].purchaseSuccessful, translations[language].purchaseMessage);

            // Optionally refresh the sellers list to show updated onMarket
            fetchSellers();

          } catch (err) {
            console.error("Error buying energy:", err);
            Alert.alert("Error", "Failed to complete the purchase. Check your network connection.");
          }
        },
      },
    ],
    { cancelable: false }
  );
};


  const executePurchase = async (seller) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Extract energy amount from availableUnits (e.g., "100 kWh" -> "100")
      const energyAmount = seller.availableUnits.split(' ')[0];
      
      const response = await fetch(`${config.API_BASE_URL}/buy/offer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId: seller.id,
          energyAmount: energyAmount
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          translations[language].purchaseSuccessful, 
          `${translations[language].purchaseMessage}\n\nTransaction Hash: ${data.data.transactionHash?.substring(0, 10)}...`
        );
        
        // Refresh the sellers list
        fetchSellers();
      } else {
        Alert.alert("Error", data.error || "Failed to complete purchase");
      }
    } catch (error) {
      console.error("Error executing purchase:", error);
      Alert.alert("Error", "Failed to complete purchase. Check your network connection.");
    }
  };

  const renderSellerList = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Feather
          name={item.type === 'peer' ? 'user' : 'server'}
          size={24}
          color="#3498DB" // Use a vibrant icon color
        />
        <Text style={styles.cardTitle}>{item.name}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardText}>
          <Text style={styles.cardLabel}>{translations[language].rate}</Text> {item.rate} {translations[language].solPerKwh}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.cardLabel}>{translations[language].availableUnits}</Text> {item.availableUnits}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.cardLabel}>{translations[language].onMarket}</Text> {item.onMarket}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.cardLabel}>{translations[language].trustScore}</Text> {item.trustScore}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.buySellButton}
        onPress={() => handleBuyEnergy(item)}
      >
        <Text style={styles.buySellButtonText}>{translations[language].buyNow}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <UniversalSafeArea style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{translations[language].buyEnergy}</Text>
        <TouchableOpacity onPress={() => setLanguage(language === "en" ? "bn" : "en")}>
          <Text style={styles.languageToggle}>{language === "en" ? "EN → BN" : "BN → EN"}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={sellers}
        renderItem={renderSellerList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          sellers.length === 0 ? styles.emptyContainer : { paddingBottom: 20 }
        ]}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{translations[language].noSellers}</Text>
          </View>
        )}
        showsVerticalScrollIndicator={true}
      />
    </UniversalSafeArea>
  );
}