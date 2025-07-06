// spacex-dashboard/src/pages/Dashboard.jsx

import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  DatePicker,
  Select,
  Empty,
  Modal,
  Spin,
  message,
} from "antd";
import {
  fetchLaunches,
  fetchLaunchpads,
  fetchRockets,
  fetchPayloads,
} from "../api/spacex";
import moment from "moment";
import "antd/dist/reset.css";

const { RangePicker } = DatePicker;
const { Option } = Select;

const statusColors = { success: "green", failed: "red", upcoming: "orange" };

const presetRanges = {
  "Past week": [moment().subtract(7, "days"), moment()],
  "Past month": [moment().subtract(1, "month"), moment()],
  "Past 3 months": [moment().subtract(3, "months"), moment()],
  "Past 6 months": [moment().subtract(6, "months"), moment()],
  "Past year": [moment().subtract(1, "year"), moment()],
  "Past 2 years": [moment().subtract(2, "years"), moment()],
};

const Dashboard = () => {
  const [launchData, setLaunchData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All Launches");
  const [dateRange, setDateRange] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [launchRes, launchpadsRes, rocketsRes, payloadsRes] =
          await Promise.all([
            fetchLaunches(),
            fetchLaunchpads(),
            fetchRockets(),
            fetchPayloads(),
          ]);

        const launchpadsMap = {};
        launchpadsRes.data.forEach((pad) => {
          launchpadsMap[pad.id] = pad.name;
        });

        const rocketsMap = {};
        rocketsRes.data.forEach((rocket) => {
          rocketsMap[rocket.id] = rocket.name;
        });

        const payloadsMap = {};
        payloadsRes.data.forEach((payload) => {
          payloadsMap[payload.id] = payload.orbit || "Unknown";
        });

        const mappedData = launchRes.data.map((launch) => {
          let orbit = "Unknown";
          if (launch.payloads && launch.payloads.length > 0) {
            orbit = payloadsMap[launch.payloads[0]] || "Unknown";
          }

          return {
            key: launch.id,
            no: launch.flight_number,
            launchDate: launch.date_utc,
            location: launchpadsMap[launch.launchpad] || "Unknown",
            mission: launch.name,
            orbit,
            status: launch.upcoming
              ? "Upcoming"
              : launch.success
              ? "Success"
              : "Failed",
            rocket: rocketsMap[launch.rocket] || "Unknown",
            details: launch.details,
            links: launch.links,
          };
        });

        setLaunchData(mappedData);
        setFilteredData(mappedData);
      } catch (error) {
        console.error(error);
        message.error("Failed to fetch SpaceX data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...launchData];
    if (selectedStatus !== "All Launches") {
      result = result.filter(
        (item) => item.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }
    if (dateRange.length === 2) {
      result = result.filter((item) => {
        const date = moment(item.launchDate);
        return date.isBetween(dateRange[0], dateRange[1], null, "[]");
      });
    }
    setFilteredData(result);
    setPagination((prev) => ({ ...prev, current: 1 })); // reset to page 1 on filter
  }, [selectedStatus, dateRange, launchData]);

  const handleTableChange = (pag) => {
    setPagination(pag);
  };

  const columns = [
    {
      title: "No.",
      dataIndex: "no",
      align: "center",
    },
    {
      title: "Launched (UTC)",
      dataIndex: "launchDate",
      align: "center",
      render: (date) => moment(date).format("DD MMM YYYY HH:mm"),
    },
    {
      title: "Location",
      dataIndex: "location",
      align: "center",
    },
    {
      title: "Mission",
      dataIndex: "mission",
      align: "center",
    },
    {
      title: "Orbit",
      dataIndex: "orbit",
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      render: (status) => (
        <Tag color={statusColors[status.toLowerCase()]}>{status}</Tag>
      ),
    },
    {
      title: "Rocket",
      dataIndex: "rocket",
      align: "center",
    },
  ];

  return (
    <div className="p-4 min-h-screen flex flex-col items-center">
      <div className="bg-white flex flex-col mb-4 shadow-md w-full justify-center items-center p-2">
        <img
          src="/spacex_logo.png"
          alt="SpaceX Logo"
          className="w-40 md:w-60 mb-2 object-contain"
        />
      </div>

      <div className="w-full md:w-[80%] mx-auto mb-4 bg-white p-4 rounded-md">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates || [])}
            format="DD-MM-YYYY"
            className="w-full md:w-auto"
            ranges={presetRanges}
          />
          <Select
            value={selectedStatus}
            onChange={setSelectedStatus}
            className="w-full md:w-60"
          >
            <Option value="All Launches">All Launches</Option>
            <Option value="Success">Successful Launches</Option>
            <Option value="Failed">Failed Launches</Option>
            <Option value="Upcoming">Upcoming Launches</Option>
          </Select>
        </div>
      </div>

      <div className="w-full md:w-[80%]">
        {loading ? (
          <div className="flex justify-center p-8">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="key"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50", "100"],
              total: filteredData.length,
              // showQuickJumper: true,
            }}
            onChange={handleTableChange}
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: <Empty description="No results found for the specified filter." />,
            }}
            bordered
            onRow={(record) => ({ onClick: () => setModalData(record) })}
          />
        )}
      </div>

      <Modal
        open={!!modalData}
        onCancel={() => setModalData(null)}
        footer={null}
        centered
      >
        {modalData && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <img
                src={
                  modalData.links?.patch?.small ||
                  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/SpaceX_CRS-1_Patch.png/480px-SpaceX_CRS-1_Patch.png"
                }
                alt="Mission Patch"
                className="w-20 h-20 rounded object-contain"
              />
              <div className="flex flex-col text-center sm:text-left">
                <h2 className="text-lg font-semibold">{modalData.mission}</h2>
                <span className="text-sm text-gray-500">{modalData.rocket}</span>
                <Tag
                  color={statusColors[modalData.status.toLowerCase()]}
                  className="w-fit mx-auto sm:mx-0 mt-1"
                >
                  {modalData.status}
                </Tag>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              {modalData.details || "No mission details available."}
            </p>
            <div className="flex flex-col border rounded-md overflow-hidden">
              {[
                { label: "Flight Number", value: modalData.no },
                { label: "Mission Name", value: modalData.mission },
                { label: "Rocket", value: modalData.rocket },
                {
                  label: "Launch Date",
                  value: moment(modalData.launchDate).format("DD MMM YYYY HH:mm"),
                },
                { label: "Orbit", value: modalData.orbit },
                { label: "Status", value: modalData.status },
                { label: "Launch Site", value: modalData.location },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between px-4 py-2 text-sm ${
                    idx !== 0 ? "border-t" : ""
                  }`}
                >
                  <span className="text-gray-600">{item.label}</span>
                  <span className="text-gray-800 font-medium text-right">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
