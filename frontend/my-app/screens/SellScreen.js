/**
 * Sell Energy Screen
 *
 * Screen for selling surplus energy to peers or the grid.
 *
 * @author Team GreyDevs
 */

import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../assets/config';
import { SafeAreaView } from 'react-native';
import { View, Text, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import UniversalSafeArea from '../components/UniversalSafeArea';
import UniversalScrollContainer from '../components/UniversalScrollContainer';
import styles from '../styles/BuySellScreenStyles.js';

const translations = {
  en: {
    sellEnergy: "Sell Energy",
    yourListing: "Your Listing",
    setPrice: "Set Price (SOL/kWh):",
    availableKwh: "Amount kWh:",
    acceptMarketRate: "Accept Market Rate?",
    liveDemand: "Live Demand",
    currentDemand: "Current Demand:",
    activeBuyers: "Active Buyers:",
    sellNow: "Sell Now",
    listingSuccessful: "Listing Successful",
    listingMessage: "Your energy is now listed for sale!",
    enterDetails: "Please enter a valid amount and price.",
    languageToggle: "EN → BN",
    onMarket: "On Market: ",
    sellMode: "Sell Mode",
  },
  bn: {
    sellEnergy: "শক্তি বিক্রি করুন",
    yourListing: "আপনার তালিকা",
    setPrice: "মূল্য নির্ধারণ করুন (SOL/kWh):",
    availableKwh: "উপলভ্য kWh:",
    acceptMarketRate: "বাজারের হার গ্রহণ করবেন?",
    liveDemand: "লাইভ চাহিদা",
    currentDemand: "বর্তমান চাহিদা:",
    activeBuyers: "সক্রিয় ক্রেতা:",
    sellNow: "এখন বিক্রি করুন",
    listingSuccessful: "তালিকা সফল হয়েছে",
    listingMessage: "আপনার শক্তি এখন বিক্রির জন্য তালিকাভুক্ত করা হয়েছে!",
    enterDetails: "অনুগ্রহ করে একটি বৈধ পরিমাণ এবং মূল্য লিখুন।",
    languageToggle: "BN → EN",
    onMarket: "বাজারে: ",
    sellMode: "বিক্রয় মোড",
  },
};

export default function SellEnergyScreen() {
  const [language, setLanguage] = useState("en");
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [useMarketRate, setUseMarketRate] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [demand, setDemand] = useState(null);
  const [marketRate, setMarketRate] = useState(null);
  const [available, setAvailable] = useState(null);
  const [onMarket, setOnMarket] = useState(null);
  const [isBuying, setIsBuying] = useState(false);
  const [sellMode, setSellMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/sell`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sell data');
      }

      setDemand(data.demand);
      setMarketRate(data.marketRate);
      setAvailable(data.available);
      setOnMarket(data.onMarket);
      setIsLoaded(data.success);
      setIsBuying(data.isBuying);
      setSellMode(!data.isBuying); // if buying, disable selling by default

    } catch (err) {
      console.error("Error fetching sell data:", err);
      Alert.alert("Error", "Failed to fetch sell data. Check your network connection.");
    }
  }

  const toggleSellMode = async (value) => {
    try {
      setSellMode(value);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/sell/mode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sellMode: value }),
      });
      Alert.alert("Success", "Sell mode updated successfully");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update mode');
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleSellEnergy = async () => {
    const finalPrice = useMarketRate ? marketRate : price;

    if (!amount || (finalPrice === '' && !useMarketRate)) {
      Alert.alert(translations[language].oops, translations[language].enterDetails);
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${config.API_BASE_URL}/sell/onMarket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          price: parseFloat(finalPrice),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to list energy');
      }

      Alert.alert(translations[language].listingSuccessful, translations[language].listingMessage);

      // Reset fields after submission
      setPrice('');
      setAmount('');
      setUseMarketRate(false);

      fetchData(); // refresh
    } catch (err) {
      Alert.alert("Error listing energy:", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading sell data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <UniversalSafeArea style={styles.safeArea}>
      <StatusBar style="dark" />
      <UniversalScrollContainer
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{translations[language].sellEnergy}</Text>
          <TouchableOpacity onPress={() => setLanguage(language === "en" ? "bn" : "en")}>
            <Text style={styles.languageToggle}>{language === "en" ? "EN → BN" : "BN → EN"}</Text>
          </TouchableOpacity>
        </View>

        {/* Live Demand Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{translations[language].liveDemand}</Text>
          <View style={styles.card}>
            <View style={styles.demandRow}>
              <Text style={styles.demandLabel}>{translations[language].currentDemand}</Text>
              <Text style={styles.demandValue}>{demand.currentDemand}</Text>
            </View>
            <View style={styles.demandRow}>
              <Text style={styles.demandLabel}>{translations[language].activeBuyers}</Text>
              <Text style={styles.demandValue}>{demand.activeBuyers}</Text>
            </View>
          </View>
        </View>

        {/* Sell Mode Toggle */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{translations[language].sellMode}</Text>
          <View style={styles.card}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{sellMode ? "ON" : "OFF"}</Text>
              <Switch
                onValueChange={toggleSellMode}
                value={sellMode}
                thumbColor={sellMode ? "#27AE60" : "#FDFEFE"}
                trackColor={{ false: "#D5D8DC", true: "#85C1E9" }}
              />
              <Text style={styles.switchLabel}>{sellMode ? "Selling" : "Buying"}</Text>

            </View>
            <Text style={{ marginTop: 8, fontSize: 13, color: '#777' }}>
              You can trade directly with this peer using the current market rate or set your own price. Your offer will be listed on others' marketplace.
            </Text>

          </View>
        </View>

        {/* Your Listing Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{translations[language].yourListing}</Text>
          <View style={styles.card}>
            <Text style={styles.inputLabel}>
              {translations[language].availableKwh} ({available ?? 0} kWh available)
            </Text>
            <Text style={styles.inputLabel}>
              {translations[language].onMarket} ({onMarket ?? 0} kWh on market)
            </Text>
            <TextInput
              style={[styles.input, !sellMode && { backgroundColor: "#eee" }]}
              placeholder={`Max: ${available ?? 0}`}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              editable={sellMode}
            />
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{translations[language].acceptMarketRate}</Text>
              <Switch
                onValueChange={setUseMarketRate}
                value={useMarketRate}
                thumbColor={useMarketRate ? "#27AE60" : "#FDFEFE"}
                trackColor={{ false: "#D5D8DC", true: "#85C1E9" }}
                disabled={!sellMode}
              />
            </View>

            <Text style={styles.inputLabel}>{translations[language].setPrice}</Text>
            <TextInput
              style={[styles.input, (!sellMode || useMarketRate) && { backgroundColor: "#eee" }]}
              placeholder={useMarketRate ? marketRate : "e.g., 0.20"}
              keyboardType="numeric"
              value={useMarketRate ? marketRate : price}
              onChangeText={setPrice}
              editable={sellMode && !useMarketRate}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.buySellButton, !sellMode && { backgroundColor: "#ccc" }]}
          onPress={handleSellEnergy}
          disabled={!sellMode}
        >
          <Text style={styles.buySellButtonText}>
            {isSubmitting ? "Creating Offer..." : translations[language].sellNow}
          </Text>
        </TouchableOpacity>
      </UniversalScrollContainer>
    </UniversalSafeArea>
  );
}
