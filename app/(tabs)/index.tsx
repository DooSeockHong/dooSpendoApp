import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Row, Rows, Table } from 'react-native-table-component';

// 한국어 로케일 설정
LocaleConfig.locales['ko'] = {
  monthNames: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ],
  monthNamesShort: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

// 캘린더에서 넘어오는 날짜 객체 타입 정의
type DayType = {
  year: number;
  month: number;
  day: number;
  timestamp: number;
  dateString: string;
};

// API로 전송할 데이터 객체 타입 정의 (타입 안전성 향상)
type SpendoData = {
  spendoTitle: string;
  spendoContent: string;
  spendoPrice: number;
  spendoType: string;
  spendoCodeType: string;
  spendoDate: string; // 💡 cretDt -> spendoDate로 수정
};

type SpendoListData = {
  spendoDate: string; // 💡 cretDt -> spendoDate로 수정
};

// GET 요청으로 받아올 공통 코드 객체 타입 정의
type CommonCodeType = {
  commonNo: number;
  commonCode: string;
  commonName: string;
};

// 가계부 내역 객체 타입 정의 (데이터 테이블용)
type SpendoItemType = {
  spendoNo: number;
  spendoTitle: string;
  spendoContent: string;
  spendoPrice: number;
  spendoType: string;
  spendoCodeType: string;
  spendoDate: string;
};

// API 응답의 전체 구조를 위한 타입 정의
type ApiResponse<T> = {
  data: T;
  msg: string;
  status: string;
};

// Axios API 클라이언트 및 요청 함수
const api = axios.create({
  baseURL: 'http://127.0.0.0:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// POST 요청 함수
export const postExpense = async (data: SpendoData) => {
  try {
    const response = await api.post('/spendo/spendoAdd', data); 
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('요청 실패 (응답 코드:', error.response.status, '):', error.response.data);
    } else {
      console.error('POST 요청 실패:', error);
    }
    throw error;
  }
};

// 지출/수입 공통 코드 GET 요청 함수
export const getCommonCodes = async (): Promise<CommonCodeType[]> => {
  try {
    const response = await api.get<ApiResponse<CommonCodeType[]>>('/common/commonExInCodeGet');
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('지출/수입 코드 GET 요청 실패 (응답 코드:', error.response.status, '):', error.response.data);
    } else {
      console.error('지출/수입 코드 GET 요청 실패:', error);
    }
    throw error;
  }
};

// 카드 종류 공통 코드 GET 요청 함수
export const getCommonCardTypeCodes = async (): Promise<CommonCodeType[]> => {
  try {
    const response = await api.get<ApiResponse<CommonCodeType[]>>('/common/commonCcCrCodeGet');
    return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
            console.error('카드 종류 코드 GET 요청 실패 (응답 코드:', error.response.status, '):', error.response.data);
          } else {
            console.error('카드 종류 코드 GET 요청 실패:', error);
          }
      throw error;
    }
};

// 선택된 날짜의 가계부 내역을 가져오는 GET 요청 함수
export const getSpendoListByDate = async (data: SpendoListData): Promise<SpendoItemType[]> => {
  try {
    const response = await api.get<ApiResponse<SpendoItemType[]>>('/spendo/spendoList', {
      params: data
    });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('가계부 내역 GET 요청 실패 (응답 코드:', error.response.status, '):', error.response.data);
    } else {
      console.error('가계부 내역 GET 요청 실패:', error);
    }
    throw error;
  }
};

const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


export default function HomeScreen() { 
  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoadingCodes, setIsLoadingCodes] = useState(true);
  
  const [spendoList, setSpendoList] = useState<SpendoItemType[]>([]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  
  const [selectedSpendoType, setSpendoType] = useState('');
  const [selectedCardType, setCardType] = useState('');

  const [commonCodes, setCommonCodes] = useState<CommonCodeType[]>([]);
  const [commonCardCodes, setCommonCardTypes] = useState<CommonCodeType[]>([]);

  const [lastTap, setLastTap] = useState<number | null>(null);

  useEffect(() => {
    const fetchAllCommonCodes = async () => {
      setIsLoadingCodes(true);
      try {
        const spendoCodes = await getCommonCodes();
        const cardCodes = await getCommonCardTypeCodes();
        
        setCommonCodes(spendoCodes);
        setCommonCardTypes(cardCodes);

        if (spendoCodes.length > 0) {
          setSpendoType(spendoCodes[0].commonCode);
        }
        if (cardCodes.length > 0) {
          setCardType(cardCodes[0].commonCode);
        }
      } catch (error) {
        Alert.alert('오류', '공통 코드를 가져오는 데 실패했습니다.');
      } finally {
        setIsLoadingCodes(false);
      }
    };
    fetchAllCommonCodes();
  }, []); 

  useEffect(() => {
    const fetchSpendoList = async () => {
      if (!selectedDate) return;
      
      try {
        const data = await getSpendoListByDate({ spendoDate: selectedDate }); // 💡 cretDt -> spendoDate로 수정
        setSpendoList(data);
      } catch (error) {
        console.error('가계부 내역을 가져오는 중 오류 발생:', error);
        Alert.alert('오류', '가계부 내역을 가져오는 데 실패했습니다.');
      }
    };
    
    fetchSpendoList();
  }, [selectedDate]);

  const onDayPress = (day: DayType) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      if (selectedDate === day.dateString) {
        handleReset();
        setModalVisible(true);
      } else {
        setSelectedDate(day.dateString);
        setLastTap(now);
      }
    } else {
      setSelectedDate(day.dateString);
      setLastTap(now);
    }
  };

  const handleReset = () => {
    setTitle('');
    setContent('');
    setPrice('');
    
    if (commonCodes.length > 0) {
      setSpendoType(commonCodes[0].commonCode);
    } else {
      setSpendoType('');
    }
    if (commonCardCodes.length > 0) {
      setCardType(commonCardCodes[0].commonCode);
    } else {
      setCardType('');
    }
  };

  const handleRegister = async () => {
    if (!title.trim()) {
      Alert.alert('입력 오류', '제목을 입력하세요.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('입력 오류', '내용을 입력하세요.');
      return;
    }

    const parsedPrice = parseInt(price, 10);
    if (!price.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('입력 오류', '올바른 가격(양수)을 입력하세요.');
      return;
    }
    
    if (!selectedSpendoType) {
        Alert.alert('입력 오류', '지출/수입 종류를 선택하세요.');
        return;
    }
    if (!selectedCardType) {
        Alert.alert('입력 오류', '카드 종류를 선택하세요.');
        return;
    }

    const data: SpendoData = {
      spendoTitle: title,
      spendoContent: content,
      spendoPrice: parsedPrice,
      spendoType: selectedSpendoType, 
      spendoCodeType: selectedCardType, 
      spendoDate: selectedDate, // 💡 cretDt -> spendoDate로 수정
    };

    console.log('API로 전송되는 데이터:', data);
    
    setIsPosting(true);
    try {
      await postExpense(data);
      Alert.alert('등록 완료', '등록이 완료되었습니다.', [{ text: '확인' }]);
      handleReset();
      setModalVisible(false);
      // 등록 후 최신 목록을 가져오기 위해 selectedDate 상태를 다시 설정
      setSelectedDate(prevDate => prevDate); 
    } catch (error) {
      console.error('POST 요청 실패:', error);
      Alert.alert('오류', '등록 중 오류가 발생했습니다. 전송 데이터를 확인해 보세요.');
    } finally {
      setIsPosting(false);
    }
  };

  const tableHead = ['날짜', '제목', '지출&수입', '카드', '가격'];
  const tableData = spendoList.map(item => [
    item.spendoDate,
    item.spendoTitle, 
    item.spendoType,
    item.spendoCodeType,
    `${item.spendoPrice.toLocaleString()}원`
  ]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Calendar
        monthFormat={'yyyy년 M월'}
        onDayPress={onDayPress}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: '#4A90E2' },
        }}
        theme={{
          selectedDayBackgroundColor: '#4A90E2',
          todayTextColor: '#4A90E2',
          arrowColor: '#4A90E2',
        }}
      />
      
      <View style={styles.tableContainer}>
        <Text style={styles.tableTitle}>{selectedDate ? `${selectedDate} 내역` : '날짜를 선택해 주세요'}</Text>
        {selectedDate && (
          <Table borderStyle={{ borderWidth: 1, borderColor: '#ccc' }}>
            <Row data={tableHead} style={styles.tableHeader} textStyle={styles.tableHeaderText} />
            {spendoList.length > 0 ? (
              <Rows data={tableData} textStyle={styles.tableCell} />
            ) : (
              <Row
                data={['해당 날짜의 내역이 없습니다.']}
                style={styles.tableNoDataRow}
                textStyle={styles.tableNoDataText}
              />
            )}
          </Table>
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={{ fontSize: 18, marginBottom: 10 }}>
                {selectedDate}
              </Text>

              <Text style={styles.label}>제목</Text>
              <TextInput
                placeholder="제목을 입력하세요"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />

              <Text style={styles.label}>내용</Text>
              <TextInput
                placeholder="내용을 입력하세요"
                value={content}
                onChangeText={setContent}
                style={[styles.input, { height: 100 }]}
                multiline                                    
                textAlignVertical="top"
              />

              <Text style={styles.label}>가격</Text>
              <TextInput
                placeholder="가격을 입력하세요"
                value={price}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^0-9]/g, '');
                  setPrice(filtered);
                }}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.label}>지출/수입</Text>
              <View style={styles.pickerWrapper}>
                {isLoadingCodes ? (
                  <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 10 }} />
                ) : (
                  commonCodes.length > 0 ? (
                    <Picker
                      selectedValue={selectedSpendoType}
                      onValueChange={(itemValue) => setSpendoType(itemValue)}
                      style={styles.picker}
                    >
                      {commonCodes.map((code) => (
                        code && (
                          <Picker.Item
                            key={String(code.commonCode)} 
                            label={String(code.commonName)} 
                            value={String(code.commonCode)}
                          />
                        )
                      ))}
                    </Picker>
                  ) : (
                    <Text style={{ padding: 12 }}>데이터를 불러오는 중...</Text>
                  )
                )}
              </View>

              <Text style={styles.label}>카드 종류</Text>
                <View style={styles.pickerWrapper}>
                  {isLoadingCodes ? (
                    <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 10 }} />
                  ) : (
                    commonCardCodes.length > 0 ? (
                      <Picker
                        selectedValue={selectedCardType}
                        onValueChange={(itemValue) => setCardType(itemValue)}
                        style={styles.picker}
                      >
                        {commonCardCodes.map((code) => (
                          code && (
                            <Picker.Item
                              key={String(code.commonCode)} 
                              label={String(code.commonName)} 
                              value={String(code.commonCode)}
                            />
                          )
                        ))}
                      </Picker>
                    ) : (
                      <Text style={{ padding: 12 }}>데이터를 불러오는 중...</Text>
                    )
                  )}
                </View>
                
              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  {isPosting ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                  ) : (
                    <Button title="등록" onPress={handleRegister} color="#4CAF50" />
                  )}
                </View>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="취소"
                    color="#f44336"
                    onPress={() => {
                      handleReset();
                      setModalVisible(false);
                    }}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '90%',
  },
  label: {
    fontSize: 20,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
  tableContainer: {
    marginTop: 20,
    marginBottom: 20,
    flex: 1,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  tableHeader: {
    height: 40,
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableHeaderText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
  },
  tableCell: {
    textAlign: 'center',
    padding: 10,
    fontSize: 12,
    color: '#555',
  },
  noDataText: {
    textAlign: 'center',
    padding: 20,
    color: '#888',
  },
  tableNoDataRow: {
    height: 60,
    backgroundColor: '#fafafa',
  },
  tableNoDataText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    paddingHorizontal: 10,
    width: '100%',
  }
});