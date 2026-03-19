import { useEffect, useState } from "react";
import { getExamAnalytics } from "../../api/adminAnalyticsApi";

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar
} from "recharts";

// import "../../styles/ExamAnalyticsPreview.css";

function ExamAnalyticsPreview({ examId }) {

  const [analytics, setAnalytics] = useState(null);
  const [graphData, setGraphData] = useState([]);

  const barData = analytics
  ? [
      { name: "Invited", value: analytics.invited },
      { name: "Pending", value: analytics.pending },
      { name: "Completed", value: analytics.completed },
      { name: "Expired", value: analytics.expired }
    ]
  : [];

  // Convert backend points -> grouped chart data
  const prepareGraphData = (points) => {

    const map = {};

    points.forEach(([marks, violations]) => {

      const key = `${marks}-${violations}`;

      if (!map[key]) {
        map[key] = {
          x: parseFloat(marks),
          y: parseInt(violations),
          count: 0
        };
      }

      map[key].count += 1;
    });

    return Object.values(map);
  };

  useEffect(() => {

    if (!examId) return;

    const fetchAnalytics = async () => {

      try {

        const res = await getExamAnalytics(examId);
        const data = res.data;

        setAnalytics(data);

        const processed = prepareGraphData(data.graphPoints || []);
        setGraphData(processed);

      } catch (err) {
        console.error("Analytics fetch failed", err);
      }

    };

    fetchAnalytics();

  }, [examId]);

  const placeholder = "???"

  // if (!analytics) {
  //   return (placeholder);
  // }


  return (
    <div className="analytics-modal">

      <div className="analytics-content">

        <div className="analytics-header">
          <h2>Exam Analytics</h2>
          {/* <button className="close-btn" onClick={onClose}>✕</button> */}
        </div>


        {/* Summary Stats */}

        <div className="analytics-summary">

          <div className="stat-box">
            <h4>Total Candidates</h4>
            <p>{analytics ? analytics.totalCandidates : placeholder}</p>
          </div>

          <div className="stat-box">
            <h4>Submissions</h4>
            <p>{analytics ? analytics.submissions : placeholder}</p>
          </div>

          <div className="stat-box">
            <h4>Qualified</h4>
            <p>{analytics ? analytics.qualified : placeholder}</p>
          </div>

          <div className="stat-box">
            <h4>Failed</h4>
            <p>{analytics ? analytics.failed : placeholder}</p>
          </div>

          <div className="stat-box">
            <h4>Cutoff</h4>
            <p>{analytics ? `${analytics.cutoff}%` : placeholder}</p>
          </div>

        </div>


        {/* Graph */}

        <div className="analytics-graph">

          <ResponsiveContainer width="100%" height={180}>

            <ScatterChart>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                type="number"
                dataKey="x"
                name="Marks"
                domain={[0, 100]}
                label={{
                  value: "Marks (%)",
                  position: "insideBottom",
                  offset: -5
                }}
              />

              <YAxis
                type="number"
                dataKey="y"
                name="Violations"
                allowDecimals={false}
                domain={[0, 4]}
                ticks={[0, 1, 2, 3, 4]}
                label={{
                  value: "Violation Count",
                  angle: -90,
                  position: "insideLeft",
                  textAnchor: "middle",
                  offset: +20
                }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;

                    return (
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #ccc",
                          padding: "10px",
                          borderRadius: "6px"
                        }}
                      >
                        <p><strong>Marks:</strong> {data.x.toFixed(2)}%</p>
                        <p><strong>Violations:</strong> {data.y}</p>
                        <p><strong>Candidates:</strong> {data.count}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Candidate Points */}

              <Scatter
                name="Candidates"
                data={graphData}
                shape={(props) => {

                  const { cx, cy, payload } = props;

                  const size = 6 + payload.count * 3;

                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={size}
                      fill="#4f46e5"
                      opacity="0.8"
                    />
                  );
                }}
              />

              {/* Cutoff Line */}

              <ReferenceLine
                x={analytics ? analytics.cutoff : 0}
                stroke="red"
                strokeDasharray="5 5"
                label={{
                  value: "Cutoff",
                  position: "top",
                  fill: "red"
                }}
              />

            </ScatterChart>

          </ResponsiveContainer>

        </div>

        {/* Candidate Status (Per Exam) */}

        <div className="exam-bar-graph">

          <h4 className="sub-chart-title">Candidate Status (This Exam)</h4>

          <ResponsiveContainer width="100%" height={180}>

            <BarChart
              data={barData
              //   [
              //   {
              //     name: "Submissions",
              //     value: analytics ? analytics.submissions : 0
              //   },
              //   {
              //     name: "Qualified",
              //     value: analytics ? analytics.qualified : 0
              //   },
              //   {
              //     name: "Failed",
              //     value: analytics ? analytics.failed : 0
              //   }
              // ]
              }
            >

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Bar dataKey="value" fill="#6c63ff" />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}

export default ExamAnalyticsPreview;