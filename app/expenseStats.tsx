import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const screenWidth = Dimensions.get('window').width;

// API 클라이언트 및 인터페이스 정의
const api = axios.create({
  baseURL: 'http://127.0.0.0:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 백엔드에서 받는 데이터 구조를 정의합니다.
interface ExpenditureResponseDTO {
  expenditurePrice: number;
  startDt: string;
  endDt: string;
  spendoTitle: string;
}

// API 응답 구조에 대한 인터페이스
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// 지출 항목에 대한 인터페이스 정의 (프론트엔드에서 사용할 형식)
interface ExpenseItem {
  name: string;
  amount: number;
}

// 지출 통계 GET 요청 함수 (날짜 인자 추가)
const getExpenditureGet = async (startDt: string, endDt: string): Promise<ExpenseItem[]> => {
  try {
    // Axios의 params 속성을 사용하여 GET 요청에 쿼리 파라미터를 추가합니다.
    const response = await api.get<ApiResponse<ExpenditureResponseDTO[]>>('/expenditure/expenditureGet', {
      params: {
        startDt: startDt,
        endDt: endDt,
      },
    });
    console.log("API 응답 데이터:", response.data.data);

    // 여기에서 백엔드 데이터를 프론트엔드 데이터 형식으로 변환합니다.
    const formattedData = response.data.data.map(item => ({
      name: item.spendoTitle,
      amount: item.expenditurePrice,
    }));

    console.log("변환된 데이터:", formattedData);

    return formattedData;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('지출 통계 GET 요청 실패 (응답 코드:', error.response.status, '):', error.response.data);
    } else {
      console.error('지출 통계 GET 요청 실패:', error);
    }
    throw error;
  }
};

// 지출 통계 메인 컴포넌트
const ExpenseStats: React.FC = () => {
  // 시작일과 종료일 상태 관리 (현재 날짜로 초기화)
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  // 날짜 선택기(picker) 표시 여부 상태 관리
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // 차트 데이터 및 차트 표시 여부 상태 관리
  const [chartData, setChartData] = useState<ExpenseItem[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 시작일 날짜 선택기 변경 핸들러
  const onChangeStartDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
  };

  // 종료일 날짜 선택기 변경 핸들러
  const onChangeEndDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
  };

  // 검색 버튼 클릭 시 실행되는 함수
  const handleSearch = async () => {
    console.log('검색 버튼이 클릭되었습니다');
    setIsLoading(true);
    
    // 날짜를 'YYYY-MM-DD' 형식으로 변환
    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
    
    console.log('시작일:', formattedStartDate);
    console.log('종료일:', formattedEndDate);

    try {
      // API 요청 함수 호출
      const data = await getExpenditureGet(formattedStartDate, formattedEndDate);
      
      // API로부터 받은 데이터를 상태에 저장하고 차트 표시
      setChartData(data);
      // 데이터가 비어 있는지 확인하여 차트 표시 여부를 결정
      if (data && data.length > 0) {
        setShowChart(true);
      } else {
        setShowChart(false);
      }
    } catch (error) {
      console.error('API 호출 중 오류 발생:', error);
      // 에러 발생 시 차트를 숨길 수 있습니다.
      setShowChart(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트가 처음 렌더링될 때 검색 함수 호출
  useEffect(() => {
    handleSearch();
  }, []);

  // 차트 Y축의 최대값을 계산
  const chartMaxValue = Array.isArray(chartData) ? Math.max(...chartData.map(d => d.amount), 0) : 0;
  const chartHeight = screenWidth * 0.5; // 화면 너비에 따른 반응형 차트 높이

  return (
    <View style={styles.container}>

      {/* 날짜 검색 섹션 */}
      <View style={styles.searchSection}>
        <Text style={styles.label}>날짜</Text>
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowStartDatePicker(true)}>
            <Text style={styles.dateText}>{moment(startDate).format('YYYY-MM-DD')}</Text>
          </TouchableOpacity>
          <Text style={styles.dateSeparator}>~</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowEndDatePicker(true)}>
            <Text style={styles.dateText}>{moment(endDate).format('YYYY-MM-DD')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 검색 버튼 */}
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={isLoading}>
        <Text style={styles.searchButtonText}>{isLoading ? '로딩 중...' : '검색'}</Text>
      </TouchableOpacity>

      {/* 차트 영역 */}
      {showChart && (
        <View style={[styles.chartArea, { height: chartHeight + 50 }]}>
          {/* Y축 레이블 */}
          <View style={styles.yAxisLabels}>
            <Text style={styles.yAxisText}>{chartMaxValue.toLocaleString()}</Text>
            <Text style={styles.yAxisText}>0</Text>
          </View>
          {/* 막대 차트 컨테이너 */}
          <View style={[styles.chartContainer, { height: chartHeight }]}>
            {Array.isArray(chartData) && chartData.map((item, index) => (
              <View key={index} style={styles.barWrapper}>
                {/* 막대 위 금액 표시 */}
                <Text style={styles.barAmount}>{item.amount.toLocaleString()}원</Text>
                <View
                  style={[
                    styles.bar,
                    // 막대 높이 계산. chartMaxValue가 0일 경우 0으로 나누는 오류 방지
                    { height: (item.amount / (chartMaxValue || 1)) * chartHeight },
                  ]}
                />
                {/* 텍스트가 잘리지 않도록 numberOfLines를 1로 설정 */}
                <Text style={styles.barLabel} numberOfLines={1}>{item.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 데이터가 없을 때 표시할 메시지 */}
      {!showChart && !isLoading && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>해당 기간에 지출 데이터가 없습니다.</Text>
          </View>
      )}

      {/* 시작일 날짜 선택기 모달 */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onChangeStartDate}
        />
      )}

      {/* 종료일 날짜 선택기 모달 */}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onChangeEndDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // 전체 화면을 차지하도록 flex 설정
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: screenWidth * 0.07,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: screenWidth * 0.04,
    fontWeight: 'bold',
    marginRight: 10,
    minWidth: 70,
    color: '#555',
  },
  dateRangeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dateText: {
    fontSize: screenWidth * 0.035,
    color: '#333',
  },
  dateSeparator: {
    fontSize: screenWidth * 0.04,
    marginHorizontal: 10,
    color: '#666',
  },
  searchButton: {
    backgroundColor: '#007aff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 10,
  },
  yAxisLabels: {
    height: '100%',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  yAxisText: {
    fontSize: screenWidth * 0.03,
    color: '#666',
  },
  chartContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barAmount: {
    fontSize: screenWidth * 0.03, // 화면 크기에 따른 글씨 크기
    color: '#000',
    marginBottom: 5, // 막대와 금액 사이의 간격
  },
  bar: {
    width: '60%',
    backgroundColor: '#007aff',
    borderRadius: 5,
    marginBottom: 5,
  },
  barLabel: {
    fontSize: screenWidth * 0.03,
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
    // 텍스트가 너무 길면 줄바꿈 대신 ...으로 표시
    width: '100%',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: screenWidth * 0.04,
    color: '#999',
  },
});

export default ExpenseStats;
